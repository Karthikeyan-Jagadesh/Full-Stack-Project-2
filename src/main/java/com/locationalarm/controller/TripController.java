package com.locationalarm.controller;

import com.locationalarm.dto.TripAlertRequest;
import com.locationalarm.model.TripAlert;
import com.locationalarm.service.TripService;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping
    public ResponseEntity<?> createTrip(@RequestBody TripAlertRequest request, HttpSession session) {
        Long userId = requireUserId(session);
        TripAlert tripAlert = tripService.createAlert(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(tripAlert);
    }

    @GetMapping("/active")
    public ResponseEntity<?> activeTrip(HttpSession session) {
        Long userId = requireUserId(session);
        return tripService.getActiveTrip(userId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of("message", "No active trip")));
    }

    @GetMapping("/history")
    public ResponseEntity<?> tripHistory(HttpSession session) {
        Long userId = requireUserId(session);
        return ResponseEntity.ok(tripService.getRecentTrips(userId));
    }

    @PutMapping("/{tripId}/complete")
    public Map<String, String> completeTrip(@PathVariable long tripId, HttpSession session) {
        Long userId = requireUserId(session);
        tripService.stopTrip(userId, tripId);
        return Map.of("message", "Trip marked as completed.");
    }

    private Long requireUserId(HttpSession session) {
        Object userId = session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalStateException("You must log in first.");
        }
        return (Long) userId;
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class, RuntimeException.class})
    public ResponseEntity<Map<String, String>> handleErrors(RuntimeException exception) {
        HttpStatus status;
        if (exception instanceof IllegalStateException) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (exception instanceof IllegalArgumentException) {
            status = HttpStatus.BAD_REQUEST;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        return ResponseEntity.status(status).body(Map.of("error", exception.getMessage()));
    }
}
