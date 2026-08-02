# ---- build stage ----
# Railway / overseas builders: Maven Central only.
# Do NOT COPY .mvn/settings.xml here — that file mirrors Aliyun for local China (maven.config).
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B || true
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/erd-online.jar app.jar
# Local / compose default 9502. PaaS (Railway / Zeabur) inject PORT — Boot must follow it.
# Expose only the HTTP port: Zeabur Git services route a single port from Dockerfile EXPOSE
# (dual EXPOSE 9502+9092 confuses port selection). SocketIO still binds SOCKETIO_PORT in-process;
# compose publishes 9092:9092 separately when needed.
EXPOSE 9502
ENTRYPOINT ["sh", "-c", "exec java -jar app.jar --server.port=${PORT:-9502}"]
