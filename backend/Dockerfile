# ---- build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY .mvn/settings.xml /root/.m2/settings.xml
RUN mvn -s /root/.m2/settings.xml dependency:go-offline -B || true
COPY src ./src
RUN mvn -s /root/.m2/settings.xml clean package -DskipTests -B

# ---- runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/erd-online.jar app.jar
# Local / compose default 9502; Railway (and similar) inject PORT — Boot must follow it.
EXPOSE 9502 9092
ENTRYPOINT ["sh", "-c", "exec java -jar app.jar --server.port=${PORT:-9502}"]
