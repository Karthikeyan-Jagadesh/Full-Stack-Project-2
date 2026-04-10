package com.locationalarm.model;

import java.time.LocalDateTime;

public class TripAlert {
    private Long id;
    private Long userId;
    private String destinationName;
    private double destinationLatitude;
    private double destinationLongitude;
    private String alarmType;
    private Integer distanceThresholdKm;
    private Integer timeThresholdMinutes;
    private String status;
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getDestinationName() {
        return destinationName;
    }

    public void setDestinationName(String destinationName) {
        this.destinationName = destinationName;
    }

    public double getDestinationLatitude() {
        return destinationLatitude;
    }

    public void setDestinationLatitude(double destinationLatitude) {
        this.destinationLatitude = destinationLatitude;
    }

    public double getDestinationLongitude() {
        return destinationLongitude;
    }

    public void setDestinationLongitude(double destinationLongitude) {
        this.destinationLongitude = destinationLongitude;
    }

    public String getAlarmType() {
        return alarmType;
    }

    public void setAlarmType(String alarmType) {
        this.alarmType = alarmType;
    }

    public Integer getDistanceThresholdKm() {
        return distanceThresholdKm;
    }

    public void setDistanceThresholdKm(Integer distanceThresholdKm) {
        this.distanceThresholdKm = distanceThresholdKm;
    }

    public Integer getTimeThresholdMinutes() {
        return timeThresholdMinutes;
    }

    public void setTimeThresholdMinutes(Integer timeThresholdMinutes) {
        this.timeThresholdMinutes = timeThresholdMinutes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
