/** Modalidades de cata del PRD, con descriptores de aroma y etiqueta de "cepa/origen". */
export interface Modality {
  key: string;
  label: string;
  emoji: string;
  /** Etiqueta para el campo "estimación" (cepa, destilería, origen, etc.). */
  guessLabel: string;
  /** Descriptores de aroma sugeridos para esta modalidad. */
  aromas: string[];
}

export const MODALITIES: Modality[] = [
  { key: "tinto", label: "Vino tinto", emoji: "🍷", guessLabel: "Cepa estimada",
    aromas: ["Frutos rojos", "Frutos negros", "Especias", "Vainilla", "Cuero", "Tabaco", "Chocolate", "Tierra húmeda", "Pimienta", "Roble"] },
  { key: "blanco", label: "Vino blanco", emoji: "🥂", guessLabel: "Cepa estimada",
    aromas: ["Cítricos", "Manzana verde", "Durazno", "Flores blancas", "Miel", "Mantequilla", "Mineral", "Hierba", "Piña", "Frutos tropicales"] },
  { key: "rosado", label: "Vino rosado", emoji: "🌸", guessLabel: "Cepa estimada",
    aromas: ["Frutilla", "Frambuesa", "Sandía", "Cítricos", "Flores", "Durazno", "Hierbas"] },
  { key: "espumante", label: "Espumante", emoji: "🍾", guessLabel: "Cepa / método",
    aromas: ["Manzana", "Pan tostado", "Levadura", "Cítricos", "Almendra", "Miel", "Flores blancas"] },
  { key: "whisky", label: "Whisky", emoji: "🥃", guessLabel: "Destilería / región",
    aromas: ["Turba", "Vainilla", "Miel", "Roble", "Frutos secos", "Humo", "Caramelo", "Especias"] },
  { key: "gin", label: "Gin", emoji: "🍸", guessLabel: "Marca / estilo",
    aromas: ["Enebro", "Cítricos", "Cardamomo", "Cilantro", "Flores", "Pepino", "Pimienta"] },
  { key: "ron", label: "Ron", emoji: "🥃", guessLabel: "Origen / estilo",
    aromas: ["Melaza", "Vainilla", "Caramelo", "Roble", "Frutos tropicales", "Especias", "Tabaco"] },
  { key: "cerveza", label: "Cerveza", emoji: "🍺", guessLabel: "Estilo",
    aromas: ["Lúpulo", "Malta", "Cítricos", "Caramelo", "Café", "Frutal", "Herbal", "Tostado"] },
  { key: "cafe", label: "Café", emoji: "☕", guessLabel: "Origen / tueste",
    aromas: ["Chocolate", "Frutal", "Nuez", "Caramelo", "Floral", "Cítrico", "Tostado", "Especias"] },
  { key: "te", label: "Té", emoji: "🍵", guessLabel: "Tipo / origen",
    aromas: ["Floral", "Herbal", "Frutal", "Tostado", "Ahumado", "Cítrico", "Dulce"] },
  { key: "chocolate", label: "Chocolate", emoji: "🍫", guessLabel: "Origen / % cacao",
    aromas: ["Frutos rojos", "Nuez", "Caramelo", "Floral", "Especias", "Tostado", "Cítrico"] },
  { key: "aceite", label: "Aceite de oliva", emoji: "🫒", guessLabel: "Variedad / origen",
    aromas: ["Hierba", "Almendra", "Tomate", "Alcachofa", "Frutal", "Picante", "Amargo"] },
  { key: "agua", label: "Agua mineral", emoji: "💧", guessLabel: "Marca / origen",
    aromas: ["Mineral", "Neutro", "Efervescente", "Dulce", "Metálico"] },
  { key: "queso", label: "Quesos", emoji: "🧀", guessLabel: "Tipo / origen",
    aromas: ["Láctico", "Nuez", "Herbal", "Picante", "Ahumado", "Terroso", "Dulce"] },
  { key: "embutido", label: "Embutidos", emoji: "🥓", guessLabel: "Tipo / origen",
    aromas: ["Especias", "Ahumado", "Curado", "Graso", "Herbal", "Picante"] },
  { key: "maridaje", label: "Maridajes", emoji: "🍽️", guessLabel: "Combinación",
    aromas: ["Equilibrado", "Contraste", "Complementa", "Realza", "Persistente"] },
];

export function getModality(key: string): Modality {
  return MODALITIES.find((m) => m.key === key) ?? MODALITIES[0];
}
