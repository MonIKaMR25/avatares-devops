"""Tests para endpoints de avatar: /api/avatar, /api/avatar/spec."""


def test_avatar_returns_svg(client):
    res = client.get("/api/avatar")
    assert res.status_code == 200
    assert res.content_type.startswith("image/svg+xml")
    assert b"<svg" in res.data


def test_avatar_with_valid_params(client):
    res = client.get("/api/avatar?eyes=DEFAULT&mouth=SMILE")
    assert res.status_code == 200
    assert b"<svg" in res.data


def test_avatar_with_color_value(client):
    res = client.get("/api/avatar?skin_color=%23D08B5B")
    assert res.status_code == 200
    assert b"<svg" in res.data


def test_avatar_ignores_unknown_params(client):
    res = client.get("/api/avatar?unknown_param=test&eyes=DEFAULT")
    assert res.status_code == 200
    assert b"<svg" in res.data


def test_avatar_ignores_invalid_values(client):
    res = client.get("/api/avatar?eyes=NONEXISTENT_VALUE")
    assert res.status_code == 200
    assert b"<svg" in res.data


def test_avatar_spec_returns_json(client):
    res = client.get("/api/avatar/spec")
    assert res.status_code == 200
    data = res.get_json()
    assert "parts" in data
    assert "groups" in data
    assert "exclusions" in data
    assert "values" in data


def test_avatar_spec_has_required_parts(client):
    res = client.get("/api/avatar/spec")
    data = res.get_json()
    parts = data["parts"]
    assert "top" in parts
    assert "eyes" in parts
    assert "mouth" in parts
    assert "skin_color" in parts
    assert "eyebrows" in parts


def test_avatar_spec_has_groups(client):
    res = client.get("/api/avatar/spec")
    data = res.get_json()
    groups = data["groups"]
    assert "facial_features" in groups
    assert "hair" in groups
    assert "eyes" in groups["facial_features"]
    assert "top" in groups["hair"]


def test_avatar_spec_has_exclusions(client):
    res = client.get("/api/avatar/spec")
    data = res.get_json()
    exclusions = data["exclusions"]
    assert "facial_hair_color" in exclusions
    assert "hair_color" in exclusions
    assert exclusions["facial_hair_color"]["part"] == "facial_hair"


def test_avatar_spec_values_are_populated(client):
    res = client.get("/api/avatar/spec")
    data = res.get_json()
    values = data["values"]
    # Cada tipo de parte debe tener al menos un valor
    for part_type in set(data["parts"].values()):
        assert part_type in values
        assert len(values[part_type]) > 0
