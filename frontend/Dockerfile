# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
# Empty bake-in; compose/k8s rewrite via docker-entrypoint.sh at container start.
ENV API_URL=
ENV ERD_API_URL=
# Optional: docker compose build --build-arg BAIDU_TONGJI_ID=… frontend
ARG BAIDU_TONGJI_ID=
ENV BAIDU_TONGJI_ID=${BAIDU_TONGJI_ID}
RUN yarn build:prod

# ---- runtime stage ----
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 运行时注入后端地址：容器启动时用环境变量重写 env-config.js
COPY docker-entrypoint.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh
EXPOSE 80
