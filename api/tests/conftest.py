import os
import subprocess
import sys
import tempfile

import pytest

# Asegurar que el directorio api/ esté primero en sys.path para que
# "from app import app" resuelva app.py y no el paquete /app/
_api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

# Configurar DB temporal antes de importar app
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DB_PATH"] = _tmp.name
_tmp.close()

# Pre-instalar SVGs custom (igual que en Docker build)
subprocess.run(
    [sys.executable, "install_parts.py"],
    cwd=_api_dir,
    check=True,
)

# Cargar app.py directamente por ruta para evitar ambigüedad con __init__.py
import importlib.util as _ilu
_spec = _ilu.spec_from_file_location("app", os.path.join(_api_dir, "app.py"))
_app_module = _ilu.module_from_spec(_spec)
sys.modules["app"] = _app_module
_spec.loader.exec_module(_app_module)
flask_app = _app_module.app


@pytest.fixture()
def app():
    """Crear instancia de la app con DB temporal para cada test."""
    flask_app.config["TESTING"] = True
    yield flask_app


@pytest.fixture()
def client(app):
    """Cliente de test Flask."""
    return app.test_client()


@pytest.fixture(autouse=True)
def _clean_db():
    """Limpiar la tabla gallery entre tests."""
    yield
    import sqlite3

    conn = sqlite3.connect(os.environ["DB_PATH"])
    conn.execute("DELETE FROM gallery")
    conn.commit()
    conn.close()
