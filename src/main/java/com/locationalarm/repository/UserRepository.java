package com.locationalarm.repository;

import com.locationalarm.config.OracleConnectionManager;
import com.locationalarm.model.User;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private final OracleConnectionManager connectionManager;

    public UserRepository(OracleConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    public Optional<User> findByEmail(String email) {
        String sql = "SELECT id, full_name, email, password_hash FROM app_users WHERE email = ?";
        try (Connection connection = connectionManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return Optional.empty();
                }

                User user = mapUser(resultSet);
                return Optional.of(user);
            }
        } catch (SQLException exception) {
            throw new RuntimeException("Failed to query user by email", exception);
        }
    }

    public User save(User user) {
        String sql = "INSERT INTO app_users (full_name, email, password_hash) VALUES (?, ?, ?)";
        try (Connection connection = connectionManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, user.getFullName());
            statement.setString(2, user.getEmail());
            statement.setString(3, user.getPasswordHash());
            statement.executeUpdate();
            return findByEmail(user.getEmail())
                    .orElseThrow(() -> new SQLException("User insert succeeded but id could not be resolved."));
        } catch (SQLException exception) {
            throw new RuntimeException("Failed to save user", exception);
        }
    }

    private User mapUser(ResultSet resultSet) throws SQLException {
        User user = new User();
        user.setId(resultSet.getLong("id"));
        user.setFullName(resultSet.getString("full_name"));
        user.setEmail(resultSet.getString("email"));
        user.setPasswordHash(resultSet.getString("password_hash"));
        return user;
    }
}
