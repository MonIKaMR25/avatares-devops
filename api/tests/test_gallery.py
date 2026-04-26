"""Tests para endpoints de galería: /api/gallery."""

import json


def test_gallery_list_empty(client):
    res = client.get("/api/gallery")
    assert res.status_code == 200
    data = res.get_json()
    assert data == []


def test_gallery_save(client):
    res = client.post(
        "/api/gallery",
        data=json.dumps({"name": "Test Avatar", "params": "eyes=DEFAULT&mouth=SMILE"}),
        content_type="application/json",
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["name"] == "Test Avatar"
    assert data["params"] == "eyes=DEFAULT&mouth=SMILE"
    assert "id" in data
    assert "created_at" in data


def test_gallery_save_truncates_long_name(client):
    long_name = "A" * 100
    res = client.post(
        "/api/gallery",
        data=json.dumps({"name": long_name, "params": "eyes=DEFAULT"}),
        content_type="application/json",
    )
    assert res.status_code == 201
    data = res.get_json()
    assert len(data["name"]) == 50


def test_gallery_save_missing_name(client):
    res = client.post(
        "/api/gallery",
        data=json.dumps({"params": "eyes=DEFAULT"}),
        content_type="application/json",
    )
    assert res.status_code == 400
    assert "error" in res.get_json()


def test_gallery_save_missing_params(client):
    res = client.post(
        "/api/gallery",
        data=json.dumps({"name": "Test"}),
        content_type="application/json",
    )
    assert res.status_code == 400


def test_gallery_save_no_body(client):
    res = client.post("/api/gallery", content_type="application/json")
    assert res.status_code == 400


def test_gallery_list_after_save(client):
    # Guardar un avatar
    client.post(
        "/api/gallery",
        data=json.dumps({"name": "Avatar 1", "params": "eyes=DEFAULT"}),
        content_type="application/json",
    )
    # Listar
    res = client.get("/api/gallery")
    data = res.get_json()
    assert len(data) == 1
    assert data[0]["name"] == "Avatar 1"


def test_gallery_list_order_desc(client):
    """Los avatares más recientes deben aparecer primero."""
    for i in range(3):
        client.post(
            "/api/gallery",
            data=json.dumps({"name": f"Avatar {i}", "params": f"eyes={i}"}),
            content_type="application/json",
        )
    res = client.get("/api/gallery")
    data = res.get_json()
    assert len(data) == 3
    assert data[0]["name"] == "Avatar 2"


def test_gallery_delete(client):
    # Guardar
    res = client.post(
        "/api/gallery",
        data=json.dumps({"name": "To Delete", "params": "eyes=DEFAULT"}),
        content_type="application/json",
    )
    avatar_id = res.get_json()["id"]

    # Eliminar
    res = client.delete(f"/api/gallery/{avatar_id}")
    assert res.status_code == 204

    # Verificar que se eliminó
    res = client.get("/api/gallery")
    data = res.get_json()
    assert len(data) == 0


def test_gallery_delete_nonexistent(client):
    """Eliminar un ID que no existe no debe fallar."""
    res = client.delete("/api/gallery/nonexistent")
    assert res.status_code == 204
