package com.supplywatch.notification.controller;

import com.supplywatch.notification.service.AlertService;
import com.supplywatch.notification.service.AlertService.Alert;
import com.supplywatch.notification.service.AlertService.AlertResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * REST controller for managing supply chain alert notifications.
 * Provides endpoints to list, create, and monitor notification alerts.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final AlertService alertService;

    public NotificationController(AlertService alertService) {
        this.alertService = alertService;
    }

    /**
     * Returns a list of mock alert notifications for the supply chain dashboard.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotifications() {
        List<Map<String, Object>> notifications = List.of(
            Map.of(
                "id", "ALERT-001",
                "type", "VULNERABILITY",
                "severity", "CRITICAL",
                "message", "Critical CVE detected in log4j-core dependency (CVE-2021-44228)",
                "component", "notification-service",
                "timestamp", Instant.now().toString()
            ),
            Map.of(
                "id", "ALERT-002",
                "type", "SBOM_DRIFT",
                "severity", "HIGH",
                "message", "SBOM drift detected — new transitive dependency introduced",
                "component", "api-gateway",
                "timestamp", Instant.now().toString()
            ),
            Map.of(
                "id", "ALERT-003",
                "type", "POLICY_VIOLATION",
                "severity", "MEDIUM",
                "message", "Artifact signature verification failed for latest build",
                "component", "frontend",
                "timestamp", Instant.now().toString()
            ),
            Map.of(
                "id", "ALERT-004",
                "type", "LICENSE_RISK",
                "severity", "LOW",
                "message", "GPL-3.0 licensed dependency detected in commercial module",
                "component", "data-processor",
                "timestamp", Instant.now().toString()
            )
        );

        return ResponseEntity.ok(notifications);
    }

    /**
     * Accepts an alert payload, processes it via AlertService, and returns confirmation.
     */
    @PostMapping("/alert")
    public ResponseEntity<AlertResponse> createAlert(@RequestBody Alert alert) {
        AlertResponse response = alertService.processAlert(alert);
        return ResponseEntity.ok(response);
    }

    /**
     * Simple health check endpoint for the notification service.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "supplywatch-notification",
            "timestamp", Instant.now().toString()
        ));
    }
}
