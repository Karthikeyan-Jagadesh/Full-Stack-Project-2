package com.locationalarm.repository;

import com.locationalarm.config.OracleConnectionManager;
import com.locationalarm.model.TripAlert;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class TripAlertRepository {

    private final OracleConnectionManager connectionManager;

    public TripAlertRepository(OracleConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    public TripAlert save(TripAlert tripAlert) {
        String sql = """
                INSERT INTO trip_alerts
                (user_id, destination_name, destination_latitude, destination_longitude, alarm_type,
                 distance_threshold_km, time_threshold_minutes, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (Connection connection = connectionManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, tripAlert.getUserId());
            statement.setString(2, tripAlert.getDestinationName());
            statement.setDouble(3, tripAlert.getDestinationLatitude());
            statement.setDouble(4, tripAlert.getDestinationLongitude());
            statement.setString(5, tripAlert.getAlarmType());
            statement.setObject(6, tripAlert.getDistanceThresholdKm());
            statement.setObject(7, tripAlert.getTimeThresholdMinutes());
            statement.setString(8, tripAlert.getStatus());
            statement.setTimestamp(9, Timestamp.valueOf(tripAlert.getCreatedAt()));
            statement.executeUpdate();
            return findActiveTripForUser(tripAlert.getUserId())
                    .orElseThrow(() -> new SQLException("Trip insert succeeded but id could not be resolved."));
        } catch (SQLException exception) {
            throw new RuntimeException("Failed to save trip alert", exception);
        }
    }

    public Optional<TripAlert> findActiveTripForUser(long userId) {
        String sql = """
                SELECT * FROM (
                    SELECT id, user_id, destination_name, destination_latitude, destination_longitude, alarm_type,
                           distance_threshold_km, time_threshold_minutes, status, created_at
                    FROM trip_alerts
                    WHERE user_id = ? AND status = 'ACTIVE'
                    ORDER BY created_at DESC
                ) WHERE ROWNUM = 1
                """;
        try (Connection connection = connectionManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, userId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return Optional.empty();
                }
                return Optional.of(mapTrip(resultSet));
            }
        } catch (SQLException exception) {
            throw new RuntimeException("Failed to load active trip", exception);
        }
    }

    public List<TripAlert> findRecentTripsForUser(long userId, int limit) {
        String sql = """
                SELECT * FROM (
                    SELECT id, user_id, destination_name, destination_latitude, destination_longitude, alarm_type,
                           distance_threshold_km, time_threshold_minutes, status, created_at
                    FROM trip_alerts
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                ) WHERE ROWNUM <= ?
                """;
        try (Connection connection = connectionManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, userId);
            statement.setInt(2, limit);
            try (ResultSet resultSet = statement.executeQuery()) {
                List<TripAlert> trips = new ArrayList<>();
                while (resultSet.next()) {
                    trips.add(mapTrip(resultSet));
                }
                return trips;
            }
        } catch (SQLException exception) {
            throw new RuntimeException("Failed to load trip history", exception);
        }
    }

    public void deactivateTrip(long tripId, long userId) {
        String sql = "UPDATE trip_alerts SET status = 'COMPLETED' WHERE id = ? AND user_id = ?";
        try (Connection connection = connectionManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, tripId);
            statement.setLong(2, userId);
            statement.executeUpdate();
        } catch (SQLException exception) {
            throw new RuntimeException("Failed to deactivate trip", exception);
        }
    }

    private TripAlert mapTrip(ResultSet resultSet) throws SQLException {
        TripAlert tripAlert = new TripAlert();
        tripAlert.setId(resultSet.getLong("id"));
        tripAlert.setUserId(resultSet.getLong("user_id"));
        tripAlert.setDestinationName(resultSet.getString("destination_name"));
        tripAlert.setDestinationLatitude(resultSet.getDouble("destination_latitude"));
        tripAlert.setDestinationLongitude(resultSet.getDouble("destination_longitude"));
        tripAlert.setAlarmType(resultSet.getString("alarm_type"));
        tripAlert.setDistanceThresholdKm(toInteger(resultSet.getObject("distance_threshold_km")));
        tripAlert.setTimeThresholdMinutes(toInteger(resultSet.getObject("time_threshold_minutes")));
        tripAlert.setStatus(resultSet.getString("status"));
        Timestamp timestamp = resultSet.getTimestamp("created_at");
        if (timestamp != null) {
            tripAlert.setCreatedAt(timestamp.toLocalDateTime());
        }
        return tripAlert;
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Integer integerValue) {
            return integerValue;
        }
        if (value instanceof BigDecimal decimalValue) {
            return decimalValue.intValue();
        }
        if (value instanceof Number numberValue) {
            return numberValue.intValue();
        }
        return Integer.valueOf(value.toString());
    }
}
