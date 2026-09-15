FROM node:22-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY shared/ /app/shared/
ARG VITE_SITE_URL
ARG VITE_META_PIXEL_ID=1811066650319146
ARG VITE_GOOGLE_ANALYTICS_ID
ENV PUBLIC_META_PIXEL_ID=$VITE_META_PIXEL_ID
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_GOOGLE_ANALYTICS_ID=$VITE_GOOGLE_ANALYTICS_ID
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY shared/ /app/shared/
COPY --from=frontend /app/frontend/dist /app/frontend/dist
ENV NODE_ENV=production SERVE_FRONTEND=true PORT=3001
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
