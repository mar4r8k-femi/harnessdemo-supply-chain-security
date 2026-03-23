package com.supplywatch.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * SupplyWatch Notification Service
 *
 * Handles alert notifications for the SupplyWatch supply chain monitoring dashboard.
 * This service processes and distributes security alerts, compliance notifications,
 * and supply chain event updates.
 */
@SpringBootApplication
public class NotificationApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationApplication.class, args);
    }
}
