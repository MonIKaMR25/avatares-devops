# Guía de Componentes

Instrucciones detalladas para ejecutar cada componente del proyecto de forma local (sin Docker).

---

## Backend de API (Python 3.12 — Flask)

### Prerrequisitos

- Python 3.12+ instalado
- pip o pip3

### Instalación

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Instalar partes custom (solo la primera vez)

La aplicación usa SVGs personalizados para las camisetas del avatar. Deben instalarse en la librería `python-avatars`:

```bash
python install_parts.py
```

### Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `FLASK_APP` | Archivo principal de Flask | `app.py` |
| `DB_PATH` | Ruta a la base de datos SQLite | `/data/avatars.db` |

```bash
export FLASK_APP=app.py
export DB_PATH=./avatars.db
```

### Ejecutar

```bash
flask run
```

El servidor estará disponible en **http://localhost:5000**.

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/avatar` | Renderizar avatar SVG (acepta query params) |
| `GET` | `/api/avatar/spec` | Opciones de personalización disponibles |
| `GET` | `/api/gallery` | Listar avatares guardados |
| `POST` | `/api/gallery` | Guardar avatar (`{name, params}`) |
| `DELETE` | `/api/gallery/:id` | Eliminar avatar |
| `GET` | `/health` | Estado del servicio + uptime |
| `GET` | `/ready` | Readiness check (204) |
| `GET` | `/metrics` | Métricas formato Prometheus |

### Tests

```bash
pip install -r requirements-test.txt
python -m pytest tests/ -v
```

---

## Frontend SPA (Node.js 22 — React + Vite)

### Prerrequisitos

- Node.js 22+ instalado
- npm

### Instalación

```bash
cd web
npm install
```

### Variables de entorno (opcionales)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_HOST` | Host del servidor de desarrollo | `0.0.0.0` |
| `VITE_PORT` | Puerto del servidor de desarrollo | `5173` |
| `VITE_API_URL` | URL del backend para el proxy | `http://localhost:5000` |

### Ejecutar

```bash
npm run dev
```

La aplicación estará disponible en **http://localhost:5173**.

> El servidor de desarrollo de Vite tiene un proxy configurado que redirige automáticamente las peticiones `/api/*` al backend. Ambos servicios deben estar corriendo simultáneamente.

### Tests

```bash
npm test
```

### Build de producción

```bash
npm run build    # Genera archivos estáticos en dist/
npm run preview  # Previsualizar el build
```

---

## Con Docker (recomendado)

La forma más sencilla de correr todo el proyecto es con Docker Compose:

```bash
make up          # Levantar la aplicación → http://localhost:8080
make test-api    # Verificar que todo funciona
make logs        # Ver logs en tiempo real
make down        # Detener
```

Ver el [README.md](./README.md) para la documentación completa.
