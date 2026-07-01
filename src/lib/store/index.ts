import "server-only";
import { hasSupabase } from "../supabase";
import * as memory from "./memory";
import * as supabase from "./supabase";

/**
 * Selecciona el backend según el entorno: Supabase si hay credenciales,
 * memoria en caso contrario. Ambos exponen la misma API asíncrona.
 */
const impl = hasSupabase() ? supabase : memory;

export const insertEvent = impl.insertEvent;
export const getEventByCode = impl.getEventByCode;
export const getEventById = impl.getEventById;
export const updateEvent = impl.updateEvent;
export const insertItem = impl.insertItem;
export const getItemsForEvent = impl.getItemsForEvent;
export const insertParticipant = impl.insertParticipant;
export const getParticipant = impl.getParticipant;
export const getParticipantsForEvent = impl.getParticipantsForEvent;
export const nameTaken = impl.nameTaken;
export const upsertEvaluation = impl.upsertEvaluation;
export const getEvaluation = impl.getEvaluation;
export const getEvaluationsForEvent = impl.getEvaluationsForEvent;
export const getEvaluationsForParticipant = impl.getEvaluationsForParticipant;
