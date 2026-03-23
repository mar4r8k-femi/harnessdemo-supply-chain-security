package com.supplywatch.notification.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Service responsible for processing supply chain alert notifications.
 * In this demo, alerts are processed in-memory with mock logic.
 */
@Service
public class AlertService {

    /**
     * Represents an incoming alert from the supply chain monitoring pipeline.
     */
    public record Alert(
        String type,
        String severity,
        String message,
        String component
    ) {}

    /**
     * Represents the processed alert response returned to the caller.
     */
    public record AlertResponse(
        String id,
        String type,
        String severity,
        String message,
        String component,
        String status,
        String processedAt
    ) {}

    /**
     * Processes an incoming alert and returns a confirmation response
     * with a generated ID, timestamp, and processing status.
     *
     * @param alert the incoming alert to process
     * @return the processed alert response with metadata
     */
    public AlertResponse processAlert(Alert alert) {
        String alertId = "ALERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String processedAt = Instant.now().toString();

        // Mock processing logic — in a real system this would dispatch
        // to notification channels (email, Slack, PagerDuty, etc.)
        String status = determineStatus(alert.severity());

        return new AlertResponse(
            alertId,
            alert.type(),
            alert.severity(),
            alert.message(),
            alert.component(),
            status,
            processedAt
        );
    }

    /**
     * Determines the processing status based on alert severity.
     */
    private String determineStatus(String severity) {
        return switch (severity != null ? severity.toUpperCase() : "UNKNOWN") {
            case "CRITICAL" -> "ESCALATED";
            case "HIGH" -> "ACKNOWLEDGED";
            case "MEDIUM" -> "QUEUED";
            case "LOW" -> "LOGGED";
            default -> "RECEIVED";
        };
    }
}
