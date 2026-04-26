"""Tests para endpoints de infraestructura: /ready, /health, /metrics."""


def test_ready_returns_204(client):
    res = client.get("/ready")
    assert res.status_code == 204


def test_health_returns_json(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["service"] == "avatars-api"
    assert "uptime_seconds" in data


def test_metrics_returns_prometheus_format(client):
    res = client.get("/metrics")
    assert res.status_code == 200
    assert "text/plain" in res.content_type
    body = res.data.decode()
    assert "avatars_generated_total" in body
    assert "avatars_saved_total" in body
    assert "http_requests_total" in body
    assert "uptime_seconds" in body


def test_metrics_counters_increment(client):
    # Generar un avatar para incrementar el contador
    client.get("/api/avatar")
    res = client.get("/metrics")
    body = res.data.decode()
    # Buscar la línea del contador (no el comentario)
    lines = [l for l in body.split("\n") if l.startswith("avatars_generated_total")]
    assert len(lines) == 1
    count = int(lines[0].split()[-1])
    assert count >= 1
