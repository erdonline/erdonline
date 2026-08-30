# Build context MUST be repo root (COPY mcp/ + backend/).
#   docker compose build backend   → context: . (see docker-compose.yml)
#   Railway Dashboard Root Directory = . ; Config as Code = backend/railway.toml
#
# ---- MCP sidecar build ----
FROM node:20-bookworm-slim AS mcp-build
WORKDIR /mcp
RUN corepack enable
COPY mcp/package.json mcp/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY mcp/tsconfig.json mcp/scripts ./
COPY mcp/src ./src
COPY mcp/guide ./guide
RUN yarn build

# ---- Java build ----
# Railway / overseas builders: Maven Central only.
# Do NOT COPY .mvn/settings.xml here — that file mirrors Aliyun for local China (maven.config).
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B || true
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# ---- runtime: one public PORT, MCP sidecar on loopback ----
FROM node:20-bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-17-jre-headless curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/erd-online.jar app.jar
COPY --from=mcp-build /mcp/package.json /mcp/yarn.lock /app/mcp/
COPY --from=mcp-build /mcp/dist /app/mcp/dist
COPY --from=mcp-build /mcp/guide /app/mcp/guide
COPY --from=mcp-build /mcp/node_modules /app/mcp/node_modules
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
# Local / compose default 9502. PaaS (Railway / Zeabur) inject PORT — Boot must follow it.
# Expose only the HTTP port: Zeabur Git services route a single port from Dockerfile EXPOSE
# (dual EXPOSE 9502+9092 confuses port selection). SocketIO still binds SOCKETIO_PORT in-process;
# compose publishes 9092:9092 separately when needed.
EXPOSE 9502
ENTRYPOINT ["/app/docker-entrypoint.sh"]
