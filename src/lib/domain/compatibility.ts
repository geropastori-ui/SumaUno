export type FitStatus = "ok" | "out" | "unknown";

export type MatchRequirements = {
  sportId: string;
  levelMin: number | null;
  levelMax: number | null;
  ageMin: number | null;
  ageMax: number | null;
  acceptanceMode: "auto" | "approval";
};

export type PlayerFacts = {
  age: number | null;
  /** Nivel del jugador en cada deporte: sportId → rank. */
  levels: Record<string, number>;
};

export type Compatibility = {
  age: FitStatus;
  level: FitStatus;
  /** Puede enviar la inscripción (la edad es excluyente). */
  canJoin: boolean;
  /** La inscripción queda pendiente de aprobación del organizador. */
  needsApproval: boolean;
  /** Etiqueta corta para tarjetas y detalle. */
  label: "Encajás" | "Fuera de tu nivel" | "Fuera de tu edad";
};

function inRange(value: number, min: number | null, max: number | null) {
  return (min == null || value >= min) && (max == null || value <= max);
}

/** Misma regla que join_match() en la base: si cambia una, cambia la otra. */
export function evaluateCompatibility(
  match: MatchRequirements,
  player: PlayerFacts,
): Compatibility {
  const hasAgeRange = match.ageMin != null || match.ageMax != null;
  const age: FitStatus = !hasAgeRange
    ? "ok"
    : player.age == null
      ? "unknown"
      : inRange(player.age, match.ageMin, match.ageMax)
        ? "ok"
        : "out";

  const hasLevelRange = match.levelMin != null || match.levelMax != null;
  const playerLevel = player.levels[match.sportId];
  const level: FitStatus = !hasLevelRange
    ? "ok"
    : playerLevel == null
      ? "out"
      : inRange(playerLevel, match.levelMin, match.levelMax)
        ? "ok"
        : "out";

  const canJoin = age === "ok";
  const needsApproval = match.acceptanceMode === "approval" || level === "out";
  const label = age === "out" ? "Fuera de tu edad" : level === "out" ? "Fuera de tu nivel" : "Encajás";

  return { age, level, canJoin, needsApproval, label };
}
