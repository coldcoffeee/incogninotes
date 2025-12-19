# language: dockerfile
# File: 'Dockerfile'
# Build Spring Boot from repo root (pom.xml at '/')
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /bloganon
COPY . .
RUN mvn -DskipTests clean package

# Runtime image with small JRE
FROM eclipse-temurin:21-jre
WORKDIR /bloganon
# Copy built jar
COPY --from=build /bloganon/target/bloganon-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
# Limit heap to 256M; app binds to Render's $PORT via application.properties
ENV JAVA_TOOL_OPTIONS="-XX:+UseZGC -Xmx256m"
CMD ["java", "-jar", "app.jar"]
