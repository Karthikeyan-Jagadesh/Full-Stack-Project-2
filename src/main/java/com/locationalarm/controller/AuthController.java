package com.locationalarm.controller;

import com.locationalarm.dto.AuthRequest;
import com.locationalarm.model.User;
import com.locationalarm.service.AuthService;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody AuthRequest request, HttpSession session) {
        User user = authService.register(request);
        session.setAttribute("userId", user.getId());
        session.setAttribute("userName", user.getFullName());
        return Map.of("message", "Registration successful.", "userName", user.getFullName());
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody AuthRequest request, HttpSession session) {
        User user = authService.login(request);
        session.setAttribute("userId", user.getId());
        session.setAttribute("userName", user.getFullName());
        return Map.of("message", "Login successful.", "userName", user.getFullName());
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        return Map.of("message", "Logged out.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidation(IllegalArgumentException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", exception.getMessage()));
    }
}
