# ==============================================================================
# Shoppage v8.1 Production Multi-Stage Dockerfile (Django 5 + Gunicorn + WhiteNoise)
# ==============================================================================

# 1. Base Stage: Python 3.12 Slim
# NOTE: No apt-get step. psycopg-binary (in requirements.txt) bundles libpq, so
# build-essential/libpq-dev are not needed; every dependency ships prebuilt wheels.
# This keeps the build independent of the Debian mirror (deb.debian.org was
# unreachable from the host at build time).
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=shoppage.settings.prod

WORKDIR /app

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

# Normalize entrypoint line endings (defensive, no-op when already LF) and set permissions
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
