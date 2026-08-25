# ==============================================================================
# Shoppage v8.1 Production Multi-Stage Dockerfile (Django 5 + Gunicorn + WhiteNoise)
# ==============================================================================

# 1. Base Stage: Python 3.12 Slim
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=shoppage.settings.prod

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# 2. Builder Stage
FROM base AS builder

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# 3. Production Runner Stage
FROM base AS runner

WORKDIR /app

# Copy installed python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy project files
COPY . .

# Convert entrypoint script line endings and set permissions
RUN dos2unix /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
