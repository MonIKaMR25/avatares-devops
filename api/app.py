import logging
import os
import sqlite3
import time
import uuid
from datetime import datetime, timezone

import flask
from flask_cors import CORS
import python_avatars as pa

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("avatars-api")
logging.getLogger("werkzeug").setLevel(logging.WARN)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = flask.Flask("avatars-api")
CORS(app)

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DB_PATH = os.environ.get("DB_PATH", "/data/avatars.db")


def get_db():
    """Return a per-request SQLite connection."""
    if "db" not in flask.g:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        flask.g.db = sqlite3.connect(DB_PATH)
        flask.g.db.row_factory = sqlite3.Row
    return flask.g.db


@app.teardown_appcontext
def close_db(_exc):
    db = flask.g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create tables if they don't exist."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS gallery (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            params      TEXT NOT NULL,
            created_at  TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


with app.app_context():
    init_db()

# ---------------------------------------------------------------------------
# Metrics (simple counters – Prometheus-compatible /metrics endpoint)
# ---------------------------------------------------------------------------
_metrics = {
    "avatars_generated_total": 0,
    "avatars_saved_total": 0,
    "requests_total": 0,
    "errors_total": 0,
}
_start_time = time.time()


@app.before_request
def _count_request():
    _metrics["requests_total"] += 1


# ---------------------------------------------------------------------------
# Avatar config
# ---------------------------------------------------------------------------
part_groups = {
    "facial_features": ["eyebrows", "eyes", "mouth", "skin_color"],
    "hair": ["top", "hair_color", "facial_hair", "facial_hair_color"],
}

part_mapping = {
    "top": "HairType",
    "hat_color": "ClothingColor",
    "eyebrows": "EyebrowType",
    "eyes": "EyeType",
    "nose": "NoseType",
    "mouth": "MouthType",
    "facial_hair": "FacialHairType",
    "skin_color": "SkinColor",
    "hair_color": "HairColor",
    "facial_hair_color": "HairColor",
    "accessory": "AccessoryType",
}

docker_blue = "#086DD7"
tilt_green = "#20BA31"


def _parse_params(raw_params):
    """Validate and convert query params to python_avatars enums."""
    params = dict(raw_params)
    unknown = [p for p in params if p not in part_mapping]
    for p in unknown:
        params.pop(p, None)

    for p in list(params):
        part_enum = getattr(pa, part_mapping[p])
        try:
            params[p] = part_enum[params[p]]
        except KeyError:
            try:
                params[p] = part_enum(params[p])
            except ValueError:
                logger.warning("Invalid value for %s: %s", p, params[p])
                params.pop(p, None)
    return params


def _render_avatar(params):
    """Render an SVG avatar from parsed params."""
    return pa.Avatar(
        style=pa.AvatarStyle.CIRCLE,
        background_color="#03C7D3",
        clothing="docker_shirt",
        clothing_color=docker_blue,
        **params,
    ).render()


# ---------------------------------------------------------------------------
# Routes – Avatar
# ---------------------------------------------------------------------------
@app.route("/api/avatar")
def avatar():
    params = _parse_params(flask.request.args)
    svg = _render_avatar(params)
    _metrics["avatars_generated_total"] += 1
    return flask.Response(svg, mimetype="image/svg+xml")


@app.route("/api/avatar/spec")
def avatar_spec():
    resp = {
        "parts": part_mapping,
        "groups": part_groups,
        "exclusions": {
            "facial_hair_color": {"part": "facial_hair", "key": "NONE"},
            "hair_color": {"part": "top", "key": "NONE"},
        },
        "values": {},
    }
    for part_type in set(resp["parts"].values()):
        values_enum = getattr(pa, part_type)
        resp["values"][part_type] = {x.name: x.value for x in values_enum}
    return flask.jsonify(resp)


# ---------------------------------------------------------------------------
# Routes – Gallery
# ---------------------------------------------------------------------------
@app.route("/api/gallery", methods=["GET"])
def gallery_list():
    db = get_db()
    rows = db.execute(
        "SELECT id, name, params, created_at FROM gallery ORDER BY created_at DESC LIMIT 50"
    ).fetchall()
    items = [dict(r) for r in rows]
    return flask.jsonify(items)


@app.route("/api/gallery", methods=["POST"])
def gallery_save():
    data = flask.request.get_json(silent=True)
    if not data or "name" not in data or "params" not in data:
        return flask.jsonify({"error": "name and params required"}), 400

    avatar_id = str(uuid.uuid4())[:8]
    now = datetime.now(timezone.utc).isoformat()
    db = get_db()
    db.execute(
        "INSERT INTO gallery (id, name, params, created_at) VALUES (?, ?, ?, ?)",
        (avatar_id, data["name"][:50], data["params"], now),
    )
    db.commit()
    _metrics["avatars_saved_total"] += 1
    return flask.jsonify({"id": avatar_id, "name": data["name"][:50], "params": data["params"], "created_at": now}), 201


@app.route("/api/gallery/<avatar_id>", methods=["DELETE"])
def gallery_delete(avatar_id):
    db = get_db()
    db.execute("DELETE FROM gallery WHERE id = ?", (avatar_id,))
    db.commit()
    return flask.Response("", status=204)


# ---------------------------------------------------------------------------
# Routes – Infra
# ---------------------------------------------------------------------------
@app.route("/ready")
def ready():
    return flask.Response("", status=204)


@app.route("/health")
def health():
    return flask.jsonify({
        "status": "healthy",
        "service": "avatars-api",
        "uptime_seconds": round(time.time() - _start_time, 1),
    })


@app.route("/metrics")
def metrics():
    """Prometheus-compatible plain text metrics."""
    uptime = round(time.time() - _start_time, 1)
    lines = [
        "# HELP avatars_generated_total Total avatars rendered",
        "# TYPE avatars_generated_total counter",
        f'avatars_generated_total {_metrics["avatars_generated_total"]}',
        "# HELP avatars_saved_total Total avatars saved to gallery",
        "# TYPE avatars_saved_total counter",
        f'avatars_saved_total {_metrics["avatars_saved_total"]}',
        "# HELP http_requests_total Total HTTP requests",
        "# TYPE http_requests_total counter",
        f'http_requests_total {_metrics["requests_total"]}',
        "# HELP http_errors_total Total HTTP errors",
        "# TYPE http_errors_total counter",
        f'http_errors_total {_metrics["errors_total"]}',
        "# HELP uptime_seconds Seconds since process start",
        "# TYPE uptime_seconds gauge",
        f"uptime_seconds {uptime}",
    ]
    return flask.Response("\n".join(lines) + "\n", mimetype="text/plain; version=0.0.4")


@app.errorhandler(Exception)
def handle_error(e):
    _metrics["errors_total"] += 1
    logger.exception("Unhandled exception")
    return flask.jsonify({"error": "internal server error"}), 500
