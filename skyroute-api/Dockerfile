# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Give execution permission to the Maven wrapper script
RUN chmod +x ./mvnw

RUN ./mvnw dependency:go-offline -B

# Copy the source code and build the JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]