let map;
let destinationMarker;
let currentMarker;
let routeLine;
let watchId;
let routeRequestToken = 0;
let activeTripId = null;
let selectedMode = "DISTANCE";
let alarmTriggered = false;
let latestPosition = null;
let previousPosition = null;
let activeTripData = null;

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsContainer = document.getElementById("search-results");
const destinationNameInput = document.getElementById("destination-name");
const destinationLatInput = document.getElementById("destination-lat");
const destinationLngInput = document.getElementById("destination-lng");
const dashboardMessage = document.getElementById("dashboard-message");
const remainingDistance = document.getElementById("remaining-distance");
const remainingTime = document.getElementById("remaining-time");
const remainingDistanceMirror = document.getElementById("remaining-distance-mirror");
const remainingTimeMirror = document.getElementById("remaining-time-mirror");
const currentSpeed = document.getElementById("current-speed");
const alarmStatus = document.getElementById("alarm-status");
const alertModeDisplay = document.getElementById("alert-mode-display");
const statusEcho = document.getElementById("status-echo");
const tripSummary = document.getElementById("trip-summary");
const currentNodeLabel = document.getElementById("current-node-label");
const destinationNodeLabel = document.getElementById("destination-node-label");
const modeNodeLabel = document.getElementById("mode-node-label");
const distanceThresholdInput = document.getElementById("distance-threshold");
const timeThresholdInput = document.getElementById("time-threshold");
const alarmAudio = document.getElementById("alarm-audio");
const historyList = document.getElementById("history-list");
const focusCurrentButton = document.getElementById("focus-current-button");
const fitRouteButton = document.getElementById("fit-route-button");
const currentLocationIcon = L.divIcon({
    className: "",
    html: '<div class="map-pin current"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 18]
});
const destinationLocationIcon = L.divIcon({
    className: "",
    html: '<div class="map-pin destination"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 18]
});

document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => switchMode(button.dataset.mode));
});

document.getElementById("save-trip-button").addEventListener("click", saveTrip);
document.getElementById("stop-trip-button").addEventListener("click", stopTrip);
document.getElementById("logout-button").addEventListener("click", logout);
document.getElementById("refresh-history-button").addEventListener("click", loadTripHistory);
focusCurrentButton.addEventListener("click", focusCurrentLocation);
fitRouteButton.addEventListener("click", fitCurrentRoute);
searchButton.addEventListener("click", searchDestination);

window.addEventListener("load", async () => {
    initMap();
    await loadActiveTrip();
    await loadTripHistory();
});

function initMap() {
    map = L.map("map").setView([13.0827, 80.2707], 12);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
    }).addTo(map);

    map.on("click", (event) => {
        setDestination({
            name: "Pinned destination",
            lat: event.latlng.lat,
            lng: event.latlng.lng
        });
    });
}

function switchMode(mode) {
    selectedMode = mode;
    alertModeDisplay.textContent = mode === "TIME" ? "ETA pulse" : "Distance pulse";
    modeNodeLabel.textContent = alertModeDisplay.textContent;
    document.querySelectorAll(".mode-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.mode === mode);
    });
    document.getElementById("distance-config").classList.toggle("active", mode === "DISTANCE");
    document.getElementById("time-config").classList.toggle("active", mode === "TIME");
}

async function searchDestination() {
    const query = searchInput.value.trim();
    if (!query) {
        dashboardMessage.textContent = "Enter a stop or landmark to scan.";
        statusEcho.textContent = "Awaiting node scan";
        return;
    }

    dashboardMessage.textContent = "Scanning route nodes...";
    statusEcho.textContent = "Node scan in progress";
    resultsContainer.innerHTML = "";

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}`);
        const places = await response.json();
        if (!places.length) {
            dashboardMessage.textContent = "No destination node matched that scan.";
            statusEcho.textContent = "No node match";
            return;
        }

        places.slice(0, 5).forEach((place) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "search-item";
            item.innerHTML = `<strong>${place.display_name.split(",")[0]}</strong><span>${place.display_name}</span>`;
            item.addEventListener("click", () => {
                setDestination({
                    name: place.display_name,
                    lat: Number(place.lat),
                    lng: Number(place.lon)
                });
                resultsContainer.innerHTML = "";
            });
            resultsContainer.appendChild(item);
        });

        dashboardMessage.textContent = "Select a node from the scan results or tap the route grid.";
        statusEcho.textContent = "Node matches ready";
    } catch (error) {
        dashboardMessage.textContent = "Destination node scan failed.";
        statusEcho.textContent = "Scan error";
    }
}

function setDestination(destination) {
    destinationNameInput.value = destination.name;
    destinationLatInput.value = destination.lat.toFixed(6);
    destinationLngInput.value = destination.lng.toFixed(6);
    destinationNodeLabel.textContent = destination.name.length > 28 ? `${destination.name.slice(0, 28)}...` : destination.name;

    if (destinationMarker) {
        destinationMarker.setLatLng([destination.lat, destination.lng]);
    } else {
        destinationMarker = L.marker([destination.lat, destination.lng], {
            icon: destinationLocationIcon
        }).addTo(map);
    }

    destinationMarker.bindPopup(destination.name).openPopup();
    void updateRouteVisuals();
    dashboardMessage.textContent = "Destination node locked. Engage the monitor when ready.";
    statusEcho.textContent = "Node locked";
}

async function saveTrip() {
    const destinationName = destinationNameInput.value.trim();
    const destinationLatitude = Number(destinationLatInput.value);
    const destinationLongitude = Number(destinationLngInput.value);

    if (!destinationName || Number.isNaN(destinationLatitude) || Number.isNaN(destinationLongitude)) {
        dashboardMessage.textContent = "Select a destination node first.";
        statusEcho.textContent = "Node required";
        return;
    }

    const payload = {
        destinationName,
        destinationLatitude,
        destinationLongitude,
        alarmType: selectedMode,
        distanceThresholdKm: selectedMode === "DISTANCE" ? Number(distanceThresholdInput.value) : null,
        timeThresholdMinutes: selectedMode === "TIME" ? Number(timeThresholdInput.value) : null
    };

    try {
        const response = await fetch("/api/trips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Could not save trip.");
        }

        activeTripId = data.id;
        activeTripData = data;
        alarmTriggered = false;
        alarmStatus.textContent = "Monitor live";
        statusEcho.textContent = "Monitor live";
        updateTripSummary(data);
        dashboardMessage.textContent = "Passenger session locked. Allow location permission to begin the live route feed.";
        startLocationTracking();
        await loadTripHistory();
    } catch (error) {
        dashboardMessage.textContent = error.message;
        statusEcho.textContent = "Save error";
    }
}

async function loadActiveTrip() {
    try {
        const response = await fetch("/api/trips/active");
        const data = await response.json();
        if (data.message) {
            updateTripSummary(null);
            alarmStatus.textContent = "Standby";
            statusEcho.textContent = "Standby";
            currentNodeLabel.textContent = "Awaiting signal";
            destinationNodeLabel.textContent = "No node locked";
            modeNodeLabel.textContent = alertModeDisplay.textContent;
            dashboardMessage.textContent = "";
            return;
        }

        activeTripId = data.id;
        activeTripData = data;
        switchMode(data.alarmType);
        destinationNameInput.value = data.destinationName;
        destinationLatInput.value = Number(data.destinationLatitude).toFixed(6);
        destinationLngInput.value = Number(data.destinationLongitude).toFixed(6);
        if (data.distanceThresholdKm) {
            distanceThresholdInput.value = data.distanceThresholdKm;
        }
        if (data.timeThresholdMinutes) {
            timeThresholdInput.value = data.timeThresholdMinutes;
        }

        setDestination({
            name: data.destinationName,
            lat: Number(data.destinationLatitude),
            lng: Number(data.destinationLongitude)
        });
        alarmStatus.textContent = "Monitor live";
        statusEcho.textContent = "Monitor live";
        updateTripSummary(data);
        startLocationTracking();
    } catch (error) {
        dashboardMessage.textContent = "Failed to load the active passenger session.";
        statusEcho.textContent = "Load error";
    }
}

function startLocationTracking() {
    if (!navigator.geolocation) {
        dashboardMessage.textContent = "Geolocation is not supported in this browser.";
        statusEcho.textContent = "Geolocation unsupported";
        return;
    }

    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }

    watchId = navigator.geolocation.watchPosition(handlePosition, handleLocationError, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
    });
}

function handlePosition(position) {
    previousPosition = latestPosition;
    latestPosition = position;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    if (currentMarker) {
        currentMarker.setLatLng([lat, lng]);
    } else {
        currentMarker = L.marker([lat, lng], {
            icon: currentLocationIcon
        }).addTo(map);
        currentMarker.bindPopup("Current location");
    }
    currentNodeLabel.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    if (!destinationLatInput.value || !destinationLngInput.value) {
        return;
    }

    const destination = {
        lat: Number(destinationLatInput.value),
        lng: Number(destinationLngInput.value)
    };
    const distanceKm = computeDistanceKm(lat, lng, destination.lat, destination.lng);
    const speedKmh = estimateSpeedKmh(position);
    const etaMinutes = speedKmh > 1 ? (distanceKm / speedKmh) * 60 : null;

    void updateRouteVisuals();
    remainingDistance.textContent = `${distanceKm.toFixed(2)} km`;
    remainingDistanceMirror.textContent = `${distanceKm.toFixed(2)} km`;
    currentSpeed.textContent = speedKmh ? `${speedKmh.toFixed(1)} km/h` : "Calculating...";
    remainingTime.textContent = etaMinutes ? `${Math.round(etaMinutes)} min` : "Need more movement";
    remainingTimeMirror.textContent = etaMinutes ? `${Math.round(etaMinutes)} min` : "Need more movement";
    if (activeTripData) {
        tripSummary.textContent = `Live route feed locked on ${activeTripData.destinationName}. Remaining distance is ${distanceKm.toFixed(2)} km.`;
    }

    evaluateAlarm(distanceKm, etaMinutes);
}

function estimateSpeedKmh(position) {
    const liveSpeed = position.coords.speed;
    if (typeof liveSpeed === "number" && liveSpeed > 0) {
        return liveSpeed * 3.6;
    }

    if (!previousPosition) {
        return null;
    }

    const distanceKm = computeDistanceKm(
        previousPosition.coords.latitude,
        previousPosition.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
    );
    const elapsedHours = (position.timestamp - previousPosition.timestamp) / 3600000;
    if (elapsedHours <= 0) {
        return null;
    }
    return distanceKm / elapsedHours;
}

function evaluateAlarm(distanceKm, etaMinutes) {
    if (alarmTriggered || !activeTripId) {
        return;
    }

    let shouldTrigger = false;
    if (selectedMode === "DISTANCE") {
        shouldTrigger = distanceKm <= Number(distanceThresholdInput.value);
    } else if (etaMinutes !== null) {
        shouldTrigger = etaMinutes <= Number(timeThresholdInput.value);
    }

    if (!shouldTrigger) {
        alarmStatus.textContent = "Monitor live";
        statusEcho.textContent = "Monitor live";
        return;
    }

    alarmTriggered = true;
    alarmStatus.textContent = "Pulse triggered";
    statusEcho.textContent = "Pulse triggered";
    tripSummary.textContent = `Wake pulse triggered for ${activeTripData?.destinationName || "the selected destination node"}.`;
    dashboardMessage.textContent = "The destination node is close. Prepare to get down.";
    alarmAudio.play().catch(() => {
        dashboardMessage.textContent = "Wake pulse triggered. Tap the page if audio playback is blocked.";
    });
    window.alert("Your destination node is getting close.");
}

async function stopTrip() {
    if (!activeTripId) {
        dashboardMessage.textContent = "No active passenger session to abort.";
        statusEcho.textContent = "Standby";
        return;
    }

    try {
        const response = await fetch(`/api/trips/${activeTripId}/complete`, { method: "PUT" });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Could not stop trip.");
        }

        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }
        watchId = null;
        activeTripId = null;
        activeTripData = null;
        alarmTriggered = false;
        alarmStatus.textContent = "Standby";
        statusEcho.textContent = "Standby";
        tripSummary.textContent = "No active route feed. Select a destination node and start the monitor.";
        resetLiveMetrics();
        clearRouteVisuals();
        dashboardMessage.textContent = data.message;
        await loadTripHistory();
    } catch (error) {
        dashboardMessage.textContent = error.message;
    }
}

async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
}

function handleLocationError(error) {
    dashboardMessage.textContent = `Location access failed: ${error.message}`;
    statusEcho.textContent = "Location issue";
}

async function loadTripHistory() {
    historyList.innerHTML = '<p class="empty-state">Loading alert sessions...</p>';
    try {
        const response = await fetch("/api/trips/history");
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Could not load trip history.");
        }
        if (!Array.isArray(data) || !data.length) {
            historyList.innerHTML = '<p class="empty-state">No alert sessions recorded yet.</p>';
            return;
        }

        historyList.innerHTML = "";
        data.forEach((trip) => {
            const item = document.createElement("article");
            item.className = "history-item";
            item.innerHTML = `
                <div class="history-main">
                    <strong>${trip.destinationName}</strong>
                    <span>${formatTripDate(trip.createdAt)}</span>
                </div>
                <div class="history-meta">
                    <span>Mode</span>
                    <strong>${trip.alarmType === "DISTANCE" ? "Distance pulse" : "ETA pulse"}</strong>
                </div>
                <div class="history-meta">
                    <span>Trigger</span>
                    <span>${formatThreshold(trip)}</span>
                </div>
                <div class="history-meta">
                    <span>Coordinates</span>
                    <strong>${Number(trip.destinationLatitude).toFixed(4)}, ${Number(trip.destinationLongitude).toFixed(4)}</strong>
                </div>
                <div class="history-meta">
                    <span>Status</span>
                    <strong class="${trip.status === "ACTIVE" ? "status-active" : "status-completed"}">${trip.status}</strong>
                </div>
            `;
            historyList.appendChild(item);
        });
    } catch (error) {
        historyList.innerHTML = `<p class="empty-state">${error.message}</p>`;
    }
}

function updateTripSummary(trip) {
    if (!trip) {
        tripSummary.textContent = "No active route feed. Select a destination node and start the monitor.";
        return;
    }
    const threshold = trip.alarmType === "DISTANCE"
        ? `${trip.distanceThresholdKm} km distance pulse`
        : `${trip.timeThresholdMinutes} min ETA pulse`;
    tripSummary.textContent = `Active route feed: ${trip.destinationName} with ${threshold}.`;
}

function resetLiveMetrics() {
    remainingDistance.textContent = "-";
    remainingDistanceMirror.textContent = "-";
    remainingTime.textContent = "-";
    remainingTimeMirror.textContent = "-";
    currentSpeed.textContent = "-";
    currentNodeLabel.textContent = "Awaiting signal";
    destinationNodeLabel.textContent = "No node locked";
    modeNodeLabel.textContent = alertModeDisplay.textContent;
}

function focusCurrentLocation() {
    if (!currentMarker) {
        dashboardMessage.textContent = "Current passenger signal is not available yet.";
        statusEcho.textContent = "Signal pending";
        return;
    }
    map.setView(currentMarker.getLatLng(), 16);
    currentMarker.openPopup();
}

function fitCurrentRoute() {
    if (!currentMarker && !destinationMarker) {
        dashboardMessage.textContent = "No live route frame is available yet.";
        statusEcho.textContent = "No route";
        return;
    }
    void updateRouteVisuals();
}

async function updateRouteVisuals() {
    if (!map || !destinationMarker) {
        return;
    }

    const layers = [destinationMarker];
    if (currentMarker) {
        layers.push(currentMarker);
        const currentLatLng = currentMarker.getLatLng();
        const destinationLatLng = destinationMarker.getLatLng();
        const points = await fetchRoadRoute(currentLatLng, destinationLatLng);

        if (routeLine) {
            routeLine.setLatLngs(points);
        } else {
            routeLine = L.polyline(points, {
                color: "#00f6ff",
                weight: 4,
                opacity: 0.92,
                dashArray: "10, 8"
            }).addTo(map);
        }
        layers.push(routeLine);
        map.fitBounds(L.featureGroup(layers).getBounds().pad(0.2));
        return;
    }

    map.setView(destinationMarker.getLatLng(), 14);
}

async function fetchRoadRoute(startLatLng, destinationLatLng) {
    const requestToken = ++routeRequestToken;
    const fallbackPoints = [startLatLng, destinationLatLng];

    try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${startLatLng.lng},${startLatLng.lat};${destinationLatLng.lng},${destinationLatLng.lat}?overview=full&geometries=geojson`
        );
        if (!response.ok) {
            return fallbackPoints;
        }

        const data = await response.json();
        const coordinates = data.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coordinates) || !coordinates.length || requestToken !== routeRequestToken) {
            return fallbackPoints;
        }

        return coordinates.map(([lng, lat]) => L.latLng(lat, lng));
    } catch (error) {
        return fallbackPoints;
    }
}

function clearRouteVisuals() {
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
}

function formatThreshold(trip) {
    if (trip.alarmType === "DISTANCE") {
        return `${trip.distanceThresholdKm} km trigger`;
    }
    return `${trip.timeThresholdMinutes} min ETA trigger`;
}

function formatTripDate(createdAt) {
    if (!createdAt) {
        return "Unknown time";
    }
    const normalized = createdAt.replace(" ", "T");
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? createdAt : date.toLocaleString();
}

function computeDistanceKm(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
