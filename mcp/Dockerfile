# MCP stdio image for Glama introspection (tools/list).
# Not the ERD Online web/API stack. No live PAT.
#
#   docker build -t erd-mcp -f mcp/Dockerfile mcp
#   printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' | docker run -i --rm erd-mcp
#
# Glama: Dockerfile path mcp/Dockerfile, context mcp/. Do not put secrets here.

FROM node:20-alpine AS build
WORKDIR /app
RUN npm install -g yarn@1.22.22
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN yarn build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# No ERD_PAT: process must boot and answer tools/list (Glama check).
ENV ERD_API_URL=https://erdonline-production.up.railway.app
RUN npm install -g yarn@1.22.22
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true && yarn cache clean
COPY --from=build /app/dist ./dist
USER node
ENTRYPOINT ["node", "dist/index.js"]
