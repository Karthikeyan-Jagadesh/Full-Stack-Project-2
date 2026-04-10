package com.locationalarm.service;

import com.locationalarm.dto.TripAlertRequest;
import com.locationalarm.model.TripAlert;
import com.locationalarm.repository.TripAlertRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class TripService {

    private final TripAlertRepository tripAlertRepository;

    public TripService(TripAlertRepository tripAlertRepository) {
        this.tripAlertRepository = tripAlertRepository;
    }

    public TripAlert createAlert(long userId, TripAlertRequest request) {
        if (request.getDestinationName() == null || request.getDestinationName().isBlank()) {
            throw new IllegalArgumentException("Destination name is required.");
        }
        if (request.getDestinationLatitude() == null || request.getDestinationLongitude() == null) {
            throw new IllegalArgumentException("Destination coordinates are required.");
        }
        if (!"DISTANCE".equalsIgnoreCase(request.getAlarmType()) && !"TIME".equalsIgnoreCase(request.getAlarmType())) {
            throw new IllegalArgumentException("Alarm type must be DISTANCE or TIME.");
        }
        if ("DISTANCE".equalsIgnoreCase(request.getAlarmType()) && request.getDistanceThresholdKm() == null) {
            throw new IllegalArgumentException("Distance threshold is required.");
        }
        if ("TIME".equalsIgnoreCase(request.getAlarmType()) && request.getTimeThresholdMinutes() == null) {
            throw new IllegalArgumentException("Time threshold is required.");
        }
        if (request.getDistanceThresholdKm() != null && request.getDistanceThresholdKm() <= 0) {
            throw new IllegalArgumentException("Distance threshold must be greater than zero.");
        }
        if (request.getTimeThresholdMinutes() != null && request.getTimeThresholdMinutes() <= 0) {
            throw new IllegalArgumentException("Time threshold must be greater than zero.");
        }

        getActiveTrip(userId).ifPresent(activeTrip -> tripAlertRepository.deactivateTrip(activeTrip.getId(), userId));

        TripAlert tripAlert = new TripAlert();
        tripAlert.setUserId(userId);
        tripAlert.setDestinationName(request.getDestinationName());
        tripAlert.setDestinationLatitude(request.getDestinationLatitude());
        tripAlert.setDestinationLongitude(request.getDestinationLongitude());
        tripAlert.setAlarmType(request.getAlarmType().toUpperCase());
        tripAlert.setDistanceThresholdKm(request.getDistanceThresholdKm());
        tripAlert.setTimeThresholdMinutes(request.getTimeThresholdMinutes());
        tripAlert.setStatus("ACTIVE");
        tripAlert.setCreatedAt(LocalDateTime.now());
        return tripAlertRepository.save(tripAlert);
    }

    public Optional<TripAlert> getActiveTrip(long userId) {
        return tripAlertRepository.findActiveTripForUser(userId);
    }

    public List<TripAlert> getRecentTrips(long userId) {
        return tripAlertRepository.findRecentTripsForUser(userId, 8);
    }

    public void stopTrip(long userId, long tripId) {
        tripAlertRepository.deactivateTrip(tripId, userId);
    }
}
