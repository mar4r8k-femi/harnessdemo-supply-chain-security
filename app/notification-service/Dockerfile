# Stage 1: Build JAR with Maven
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src/ ./src/
RUN mvn package -DskipTests -B

# Stage 2: Production image
FROM eclipse-temurin:21-jre-alpine

LABEL org.opencontainers.image.title="supplywatch-notification" \
      org.opencontainers.image.description="SupplyWatch Notification Service" \
      org.opencontainers.image.vendor="Harness SCS Demo" \
      org.opencontainers.image.version="1.0.0"

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8082/actuator/health || exit 1

USER 1000:1000

ENTRYPOINT ["java", "-jar", "app.jar"]
