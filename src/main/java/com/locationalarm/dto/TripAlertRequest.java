package com.locationalarm.dto;

public class TripAlertRequest {
    private String destinationName;
    private Double destinationLatitude;
    private Double destinationLongitude;
    private String alarmType;
    private Integer distanceThresholdKm;
    private Integer timeThresholdMinutes;

    public String getDestinationName() {
        return destinationName;
    }

    public void setDestinationName(String destinationName) {
        this.destinationName = destinationName;
    }

    public Double getDestinationLatitude() {
        return destinationLatitude;
    }

    public void setDestinationLatitude(Double destinationLatitude) {
        this.destinationLatitude = destinationLatitude;
    }

    public Double getDestinationLongitude() {
        return destinationLongitude;
    }

    public void setDestinationLongitude(Double destinationLongitude) {
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
}
