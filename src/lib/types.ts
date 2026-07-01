export type EventStatus = "lobby" | "tasting" | "closed" | "revealed";

export interface TastingEvent {
  id: string;
  code: string; // 6 chars, shareable
  title: string;
  modality: string; // key from MODALITIES
  status: EventStatus;
  currentIndex: number; // active item during tasting (modo guiado)
  hostToken: string; // secret, never sent to participants
  doubleBlind: boolean; // vinos solo numerados; info se agrega al final
  freePace: boolean; // catadores evalúan/editan cualquier vino cuando quieran
  recoveryCode: string; // código SOS para recuperar admin en otro dispositivo
  createdAt: string;
}

export interface TastingItem {
  id: string;
  eventId: string;
  position: number; // 1-based order
  // Hidden while blind; revealed at the end
  name: string;
  producer: string | null;
  grape: string | null;
  region: string | null;
  price: number | null;
  imageUrl: string | null;
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  token: string; // secret
  createdAt: string;
}

export interface Evaluation {
  id: string;
  eventId: string;
  itemId: string;
  participantId: string;
  aroma: number; // 1-10
  flavor: number; // 1-10
  balance: number; // 1-10
  wouldBuy: boolean | null;
  overall: number; // 1-100 nota general
  notes: string | null;
  aromas: string[]; // descriptores seleccionados
  estimatedGrape: string | null;
  estimatedPrice: number | null;
  confidence: number; // 1-5
  updatedAt: string;
}

/** Public view of an event (no secrets), what participants receive. */
export interface PublicEvent {
  code: string;
  title: string;
  modality: string;
  status: EventStatus;
  currentIndex: number;
  itemCount: number;
  doubleBlind: boolean;
  freePace: boolean;
}
