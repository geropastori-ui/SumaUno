"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/data/session";
import { friendlyDbError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; status?: string } | { ok: false; error: string };

function refresh(matchId: string) {
  revalidatePath(`/partidos/${matchId}`);
  revalidatePath("/explorar");
  revalidatePath("/mis-partidos");
}

async function guard(): Promise<ActionResult | null> {
  return (await getSessionUser()) ? null : { ok: false, error: "Necesitás iniciar sesión." };
}

export async function joinMatch(matchId: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_match", { p_match_id: matchId });
  if (error) return { ok: false, error: friendlyDbError(error) };
  refresh(matchId);
  return { ok: true, status: data };
}

export async function leaveMatch(matchId: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_match", { p_match_id: matchId });
  if (error) return { ok: false, error: friendlyDbError(error) };
  refresh(matchId);
  return { ok: true };
}

export async function respondToRequest(
  matchId: string,
  participantId: string,
  accept: boolean,
): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_to_request", {
    p_participant_id: participantId,
    p_accept: accept,
  });
  if (error) return { ok: false, error: friendlyDbError(error) };
  refresh(matchId);
  return { ok: true, status: data };
}

export async function removeParticipant(matchId: string, participantId: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_participant", { p_participant_id: participantId });
  if (error) return { ok: false, error: friendlyDbError(error) };
  refresh(matchId);
  return { ok: true };
}

export async function setMatchStatus(
  matchId: string,
  status: "open" | "closed" | "cancelled",
): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_match_status", { p_match_id: matchId, p_status: status });
  if (error) return { ok: false, error: friendlyDbError(error) };
  refresh(matchId);
  return { ok: true, status: data };
}
