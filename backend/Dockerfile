# ---- build stage ----
FROM maven:3.8-openjdk-8 AS build
WORKDIR /app
COPY pom.xml .
COPY .mvn/settings.xml /root/.m2/settings.xml
RUN mvn -s /root/.m2/settings.xml dependency:go-offline -B || true
COPY src ./src
RUN mvn -s /root/.m2/settings.xml clean package -DskipTests -B

# ---- runtime stage ----
FROM openjdk:8-jre-slim
WORKDIR /app
COPY --from=build /app/target/erd-online.jar app.jar
EXPOSE 9502 9092
ENTRYPOINT ["java", "-jar", "app.jar"]
