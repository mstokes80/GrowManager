# ============================================================
# Multi-stage Dockerfile for GrowManager API (Production)
# ============================================================
# Stage 1: Build the application with Maven
# Stage 2: Run the application with JRE (smaller final image)
# ============================================================

# -----------------------------
# Stage 1: Build with Maven
# -----------------------------
FROM maven:3.9-amazoncorretto-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests -Dcheckstyle.skip=true -Dspotbugs.skip=true -B

# -----------------------------
# Stage 2: Run with JRE
# -----------------------------
FROM amazoncorretto:17-alpine3.20-jdk

# Add labels for metadata
LABEL maintainer="GrowManager Team"
LABEL description="GrowManager API - Spring Boot Application"
LABEL version="1.0.0"

# Install wget for health checks
RUN apk add --no-cache wget

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Set working directory
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R spring:spring /app

# Switch to non-root user
USER spring:spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Dspring.profiles.active=prod", \
  "-jar", \
  "app.jar"]