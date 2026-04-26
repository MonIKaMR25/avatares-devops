import os
import subprocess
import sys
import tempfile

import pytest

# Configurar DB temporal antes de importar app
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DB_PATH"] = _tmp.name
_tmp.close()

# Pre-instalar SVGs custom (igual que en Docker build)
subprocess.run(
    [sys.executable, "install_parts.py"],
    cwd=os.path.join(os.path.dirname(__file__), ".."),
    check=True,
)

from app import app as flask_app


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
