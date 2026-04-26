import { useEffect, useState, useCallback } from "react";
import "./App.css";
import Parts from "./Parts";
import Gallery from "./Gallery";

function App() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState(null);
  const [partChoices, setPartChoices] = useState({});
  const [avatarURL, setAvatarURL] = useState(null);
  const [tab, setTab] = useState("editor");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const randomizeChoices = useCallback(
    (currentSpec) => {
      const s = currentSpec ?? spec;
      if (!s) return;
      const parts = {};
      for (const partName of Object.keys(s.parts)) {
        if (Object.values(s.groups).some((g) => g.includes(partName))) {
          const partType = s.parts[partName];
          const values = Object.values(s.values[partType]);
          parts[partName] = values[Math.floor(Math.random() * values.length)];
        }
      }
      setPartChoices(parts);
    },
    [spec],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/avatar/spec", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((result) => {
        setSpec(result);
        randomizeChoices(result);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onPartChoice = useCallback((name, value) => {
    setPartChoices((prev) => ({ ...prev, [name]: value }));
  }, []);

  useEffect(() => {
    if (loading || !partChoices || Object.keys(partChoices).length === 0) {
      setAvatarURL(null);
      return;
    }
    setAvatarURL("/api/avatar?" + new URLSearchParams(partChoices));
  }, [partChoices, loading]);

  const handleDownload = useCallback(async () => {
    if (!avatarURL) return;
    try {
      const res = await fetch(avatarURL);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mi-avatar.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Avatar descargado");
    } catch {
      showToast("Error al descargar", "error");
    }
  }, [avatarURL, showToast]);

  const handleSaveToGallery = useCallback(async () => {
    if (!partChoices || Object.keys(partChoices).length === 0) return;
    const name = prompt("Nombre para tu avatar:");
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          params: new URLSearchParams(partChoices).toString(),
        }),
      });
      if (res.ok) {
        showToast(`"${name}" guardado en la galería`);
      } else {
        showToast("Error al guardar", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  }, [partChoices, showToast]);

  if (error) {
    return (
      <div className="app">
        <div className="error-screen fade-in">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">No se pudo conectar</h2>
          <p className="error-message">
            Verifica que el servidor API esté corriendo e intenta de nuevo.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <span className="btn-icon">🔄</span>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner" role="status" aria-label="Cargando" />
          <p className="loading-text">Cargando generador de avatares…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {toast && (
        <div className={`toast toast--${toast.type} fade-in`} role="alert">
          {toast.message}
        </div>
      )}

      <header className="header">
        <div className="header-brand">
          <div className="header-logo" aria-hidden="true">
            👤
          </div>
          <div>
            <h1>Avatares</h1>
            <span className="header-subtitle">Generador de Avatares</span>
          </div>
        </div>
        <nav className="header-nav" aria-label="Navegación principal">
          <button
            className={`nav-tab${tab === "editor" ? " nav-tab--active" : ""}`}
            onClick={() => setTab("editor")}
          >
            ✏️ Editor
          </button>
          <button
            className={`nav-tab${tab === "gallery" ? " nav-tab--active" : ""}`}
            onClick={() => setTab("gallery")}
          >
            🖼️ Galería
          </button>
        </nav>
      </header>

      {tab === "editor" ? (
        <main className="main-content">
          <section className="avatar-panel" aria-label="Vista previa del avatar">
            <div className="avatar-container">
              <div className="avatar-glow" aria-hidden="true" />
              <img
                className="avatar-image"
                src={avatarURL}
                alt="Tu avatar personalizado"
              />
            </div>
            <div className="avatar-actions">
              <button
                className="btn btn-primary"
                onClick={() => randomizeChoices()}
              >
                <span className="btn-icon" aria-hidden="true">🎲</span>
                Aleatorio
              </button>
              <button className="btn btn-secondary" onClick={handleDownload}>
                <span className="btn-icon" aria-hidden="true">💾</span>
                Descargar
              </button>
              <button
                className="btn btn-accent"
                onClick={handleSaveToGallery}
                disabled={saving}
              >
                <span className="btn-icon" aria-hidden="true">⭐</span>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </section>

          <section className="editor-panel" aria-label="Editor de avatar">
            <h2 className="editor-title">Personaliza tu avatar</h2>
            <p className="editor-description">
              Ajusta cada detalle para crear un avatar único.
            </p>
            <Parts spec={spec} choices={partChoices} onChange={onPartChoice} />
          </section>
        </main>
      ) : (
        <main className="gallery-container">
          <div className="gallery-header">
            <h2 className="editor-title">Galería de Avatares</h2>
            <p className="editor-description">
              Avatares guardados por la comunidad.
            </p>
          </div>
          <Gallery />
        </main>
      )}

      <footer className="footer">
        <span>Avatares v2.0</span>
        <span className="footer-sep">·</span>
        <span>Proyecto DevOps</span>
        <span className="footer-sep">·</span>
        <a href="/health" className="footer-link" target="_blank" rel="noopener">
          API Health
        </a>
        <span className="footer-sep">·</span>
        <a href="/metrics" className="footer-link" target="_blank" rel="noopener">
          Métricas
        </a>
      </footer>
    </div>
  );
}

export default App;
