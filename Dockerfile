# language: dockerfile
# File: 'Dockerfile'
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /bloganon
COPY . .
RUN mvn -DskipTests clean package

FROM eclipse-temurin:21-jre
WORKDIR /bloganon
COPY --from=build /bloganon/target/bloganon-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
CMD ["java", "-XX:+UseZGC", "-Xmx256m", "-jar", "app.jar"]
