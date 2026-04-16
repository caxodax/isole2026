// src/data/albums.js
export const ALBUMS = [
  {
    id: "auto-clio-pitufo",
    category: "automotriz",
    title: 'Renault Clio "Pitufó"',
    subtitle: "Fotografía nocturna / estética cine",
    cover: "/TS40.jpg", // portada (en /public)
    description:
      "Buscamos ángulos, textura y reflejos para que el vehículo se sienta como una escena.",
    photos: [
      { src: "/TS40.jpg", caption: 'Clio “Pitufó” — toma nocturna con neón.' },
      { src: "/TS40.jpg" },
      { src: "/TS40.jpg" }
    ]
  },

  {
    id: "evento-ts",
    category: "evento",
    title: "TS Fest",
    subtitle: "Cobertura / ambiente / detalle",
    cover: "/TS40.jpg",
    description:
      "Cobertura de evento con narrativa visual: contexto, emoción y detalle.",
    photos: [{ src: "/TS40.jpg" }, { src: "/TS40.jpg" }]
  },

  {
    id: "empresa-laa",
    category: "empresa",
    title: "Laa Fest",
    subtitle: "Contenido para marca",
    cover: "/TS40.jpg",
    description:
      "Piezas diseñadas para campañas y redes, con presencia real y coherencia estética.",
    photos: [{ src: "/TS40.jpg" }, { src: "/TS40.jpg" }]
  }
];

export const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "automotriz", label: "Automotriz" },
  { key: "empresa", label: "Empresa" },
  { key: "evento", label: "Evento" }
];
