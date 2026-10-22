# --- Stage 1: build the Vite production bundle ---------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first so this layer is cached between builds.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: serve the static build with nginx on port 80 ---------------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
