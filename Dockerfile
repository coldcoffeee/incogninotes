# dockerfile
# Build Spring Boot project located in `bloganon/`
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /bloganon
COPY bloganon/ .
RUN mvn -DskipTests clean package

# Runtime image with JRE
FROM eclipse-temurin:21-jre
WORKDIR /bloganon
COPY --from=build /bloganon/target/bloganon-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:+UseZGC -Xmx256m"
CMD ["java", "-jar", "app.jar"]
