# ── Stage 1: Build frontend ──────────────────────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ── Stage 2: Production ─────────────────────────────────────────────────
FROM python:3.12-slim
WORKDIR /app

# Install nginx + supervisord
RUN apt-get update && apt-get install -y --no-install-recommends nginx supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy built frontend to nginx webroot
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy .env if present
COPY .env* ./

# Copy config files
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/app.conf

EXPOSE 3000

CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
