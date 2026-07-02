/** Frases con humor para acompañar la evaluación. Nada de esto es serio. */
export const TASTING_TIPS: string[] = [
  "Paso 1: Mira el vino. Paso 2: Huélelo. Paso 3: Pruébalo. Paso 4: Inventa una descripción elegante como 'notas de cuero y frutos rojos' aunque solo sientas... vino.",
  "Gira la copa como si supieras lo que estás haciendo. La confianza es el 80% de la cata.",
  "Si sientes aromas a 'grava mojada y tabaco de pipa inglesa', felicitaciones: ya puedes trabajar en una revista de vinos.",
  "No te lo tomes al seco. Esto es una cata, no un asado.",
  "El primer sorbo es para el shock. El segundo, para pensar. El tercero, para opinar con autoridad.",
  "Si dudas entre dos notas, di las dos. Nadie te va a auditar.",
  "El silencio pensativo mientras miras la copa a la luz suma puntos de credibilidad, aunque no estés pensando en nada.",
  "Regla de oro: si no sabes qué decir, di 'tiene cuerpo'. Siempre funciona.",
  "Escupir es opcional. Fingir que sabes por qué se escupe, también.",
  "Cuidado con el vino 3: siempre parece mejor que el vino 1, y no siempre es por el vino.",
];

export function randomTip(exclude?: string): string {
  if (TASTING_TIPS.length === 1) return TASTING_TIPS[0];
  let pick = TASTING_TIPS[Math.floor(Math.random() * TASTING_TIPS.length)];
  while (pick === exclude) {
    pick = TASTING_TIPS[Math.floor(Math.random() * TASTING_TIPS.length)];
  }
  return pick;
}
