FROM python:3.12-slim AS base

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Pre-instalar SVGs custom en el paquete python_avatars durante el build
# Esto evita race conditions con múltiples workers de gunicorn
RUN python install_parts.py

# Crear directorio de datos y usuario no-root
RUN useradd --create-home appuser && \
    mkdir -p /data && \
    chown appuser:appuser /data
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:5000/ready || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--access-logfile", "-", "app:app"]
