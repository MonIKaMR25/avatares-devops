import { useEffect, useState, useCallback } from "react";

function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGallery = useCallback(() => {
    setLoading(true);
    fetch("/api/gallery")
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleDelete = async (id) => {
    await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="loading-spinner" role="status" aria-label="Cargando galería" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="gallery-empty fade-in">
        <div className="gallery-empty-icon">🖼️</div>
        <h3>La galería está vacía</h3>
        <p>Crea un avatar y guárdalo para verlo aquí.</p>
      </div>
    );
  }

  return (
    <div className="gallery-grid fade-in">
      {items.map((item) => (
        <div key={item.id} className="gallery-card">
          <img
            className="gallery-avatar"
            src={`/api/avatar?${item.params}`}
            alt={`Avatar de ${item.name}`}
            loading="lazy"
          />
          <div className="gallery-card-info">
            <span className="gallery-card-name">{item.name}</span>
            <span className="gallery-card-date">
              {new Date(item.created_at).toLocaleDateString("es")}
            </span>
          </div>
          <button
            className="gallery-card-delete"
            onClick={() => handleDelete(item.id)}
            aria-label={`Eliminar avatar de ${item.name}`}
            title="Eliminar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default Gallery;
