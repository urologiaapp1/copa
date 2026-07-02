import type { Locale } from "./i18n/locales";

/** Frases con humor para acompañar la evaluación. Nada de esto es serio. */
export const TASTING_TIPS: Record<Locale, string[]> = {
  es: [
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
  ],
  en: [
    "Step 1: Look at the wine. Step 2: Smell it. Step 3: Taste it. Step 4: Invent a fancy description like 'notes of leather and red berries' even if all you're getting is... wine.",
    "Swirl the glass like you know what you're doing. Confidence is 80% of tasting.",
    "If you're picking up 'wet gravel and English pipe tobacco,' congrats: you're ready to write for a wine magazine.",
    "Don't shoot it. This is a tasting, not a round of shots.",
    "The first sip is for the shock. The second is for thinking it over. The third is for opinions delivered with total authority.",
    "Torn between two notes? Say both. No one's auditing you.",
    "Staring thoughtfully at the glass against the light earns you credibility points, even if you're thinking about nothing at all.",
    "Golden rule: if you don't know what to say, say 'it has body.' Works every time.",
    "Spitting is optional. Pretending to know why people spit is too.",
    "Watch out for wine number 3: it always seems better than wine number 1, and it's not always because of the wine.",
  ],
  pt: [
    "Passo 1: Olhe o vinho. Passo 2: Sinta o aroma. Passo 3: Prove. Passo 4: Invente uma descrição sofisticada tipo 'notas de couro e frutas vermelhas' mesmo que você só esteja sentindo... vinho.",
    "Gire a taça como se soubesse o que está fazendo. Confiança é 80% da degustação.",
    "Se você sentir 'pedra molhada e tabaco de cachimbo inglês', parabéns: já pode escrever para uma revista de vinhos.",
    "Não vire de uma vez. Isso é uma degustação, não um happy hour.",
    "O primeiro gole é para o choque. O segundo, para pensar. O terceiro, para opinar com autoridade total.",
    "Ficou em dúvida entre duas notas? Diga as duas. Ninguém vai te auditar.",
    "O silêncio pensativo olhando a taça contra a luz rende pontos de credibilidade, mesmo que você não esteja pensando em nada.",
    "Regra de ouro: se não souber o que dizer, diga 'tem corpo'. Sempre funciona.",
    "Cuspir é opcional. Fingir que sabe por que se cospe, também.",
    "Cuidado com o vinho 3: sempre parece melhor que o vinho 1, e nem sempre é por causa do vinho.",
  ],
  fr: [
    "Étape 1 : Regardez le vin. Étape 2 : Sentez-le. Étape 3 : Goûtez-le. Étape 4 : Inventez une description chic du genre 'notes de cuir et de fruits rouges' même si tout ce que vous sentez, c'est... du vin.",
    "Faites tourner le verre comme si vous saviez ce que vous faisiez. La confiance, c'est 80% de la dégustation.",
    "Si vous sentez des notes de 'gravier mouillé et de tabac à pipe anglais', félicitations : vous pouvez écrire dans un magazine de vin.",
    "Ne le buvez pas cul sec. C'est une dégustation, pas un apéro entre potes.",
    "La première gorgée, c'est pour le choc. La deuxième, pour réfléchir. La troisième, pour donner votre avis avec autorité.",
    "Hésitant entre deux notes ? Dites les deux. Personne ne va vérifier.",
    "Regarder le verre à la lumière d'un air pensif, ça donne des points de crédibilité, même si vous ne pensez à rien du tout.",
    "Règle d'or : si vous ne savez pas quoi dire, dites 'il a du corps'. Ça marche à chaque fois.",
    "Cracher est optionnel. Faire semblant de savoir pourquoi on crache aussi.",
    "Attention au vin numéro 3 : il paraît toujours meilleur que le numéro 1, et ce n'est pas toujours grâce au vin.",
  ],
  it: [
    "Passo 1: Guarda il vino. Passo 2: Annusalo. Passo 3: Assaggialo. Passo 4: Inventa una descrizione elegante tipo 'note di cuoio e frutti rossi' anche se senti solo... vino.",
    "Fai roteare il calice come se sapessi cosa stai facendo. La sicurezza è l'80% della degustazione.",
    "Se senti 'ghiaia bagnata e tabacco da pipa inglese', congratulazioni: puoi già scrivere per una rivista di vini.",
    "Non berlo tutto d'un fiato. Questa è una degustazione, non un aperitivo.",
    "Il primo sorso è per lo shock. Il secondo, per riflettere. Il terzo, per dare un'opinione con piena autorità.",
    "Indeciso tra due note? Dille entrambe. Nessuno ti controlla.",
    "Il silenzio pensieroso guardando il calice controluce vale punti di credibilità, anche se non stai pensando a niente.",
    "Regola d'oro: se non sai cosa dire, di' 'ha struttura'. Funziona sempre.",
    "Sputare è facoltativo. Fingere di sapere perché si sputa anche.",
    "Attento al vino numero 3: sembra sempre migliore del numero 1, e non è sempre merito del vino.",
  ],
};

export function randomTip(locale: Locale, exclude?: string): string {
  const tips = TASTING_TIPS[locale] ?? TASTING_TIPS.es;
  if (tips.length === 1) return tips[0];
  let pick = tips[Math.floor(Math.random() * tips.length)];
  while (pick === exclude) {
    pick = tips[Math.floor(Math.random() * tips.length)];
  }
  return pick;
}
