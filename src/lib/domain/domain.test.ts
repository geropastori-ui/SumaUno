import { describe, expect, it } from "vitest";
import { ageFromBirthDate, isAdult, maxBirthDate } from "./age";
import { evaluateCompatibility, type MatchRequirements } from "./compatibility";
import { formatDayLabel, formatMatchWhen } from "./dates";
import { formatAgeRange, formatLevelRange, type SportLevel } from "./levels";
import { formatPrice } from "./money";
import { addDaysToKey, arLocalToIso, dateKeyInAR, weekdayOfKey } from "./time";
import { formatArMobile, normalizeArMobile, whatsappLink } from "./whatsapp";

// 12/10/2026 22:30 en Argentina = 13/10/2026 01:30 UTC
const NOW = new Date("2026-10-13T01:30:00Z");

describe("time", () => {
  it("usa el día calendario argentino", () => {
    expect(dateKeyInAR(NOW)).toBe("2026-10-12");
  });
  it("convierte hora local a instante", () => {
    expect(arLocalToIso("2026-10-14", "21:30")).toBe("2026-10-15T00:30:00.000Z");
  });
  it("suma días y calcula el día de semana", () => {
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(weekdayOfKey("2026-10-12")).toBe(1);
  });
});

describe("edad", () => {
  it("cuenta años cumplidos", () => {
    expect(ageFromBirthDate("2000-10-12", NOW)).toBe(26);
    expect(ageFromBirthDate("2000-10-13", NOW)).toBe(25);
  });
  it("valida mayoría de edad", () => {
    expect(isAdult("2008-10-12", NOW)).toBe(true);
    expect(isAdult("2008-10-13", NOW)).toBe(false);
    expect(maxBirthDate(NOW)).toBe("2008-10-12");
  });
});

describe("compatibilidad", () => {
  const match: MatchRequirements = {
    sportId: "futbol",
    levelMin: 2,
    levelMax: 3,
    ageMin: 25,
    ageMax: 40,
    acceptanceMode: "auto",
  };

  it("encaja en edad y nivel: entra directo", () => {
    const c = evaluateCompatibility(match, { age: 30, levels: { futbol: 2 } });
    expect(c).toMatchObject({ canJoin: true, needsApproval: false, label: "Encajás" });
  });
  it("fuera de nivel: puede anotarse pero pasa por aprobación", () => {
    const c = evaluateCompatibility(match, { age: 30, levels: { futbol: 1 } });
    expect(c).toMatchObject({ canJoin: true, needsApproval: true, label: "Fuera de tu nivel" });
  });
  it("sin nivel cargado en ese deporte cuenta como fuera de nivel", () => {
    const c = evaluateCompatibility(match, { age: 30, levels: {} });
    expect(c.level).toBe("out");
  });
  it("fuera de edad: no puede anotarse", () => {
    const c = evaluateCompatibility(match, { age: 45, levels: { futbol: 2 } });
    expect(c).toMatchObject({ canJoin: false, label: "Fuera de tu edad" });
  });
  it("sin rangos, todos encajan", () => {
    const open = { ...match, levelMin: null, levelMax: null, ageMin: null, ageMax: null };
    expect(evaluateCompatibility(open, { age: 60, levels: {} }).label).toBe("Encajás");
  });
  it("modo con aprobación siempre pide aprobación", () => {
    const c = evaluateCompatibility({ ...match, acceptanceMode: "approval" }, { age: 30, levels: { futbol: 2 } });
    expect(c.needsApproval).toBe(true);
  });
});

describe("niveles y edades", () => {
  const futbol: SportLevel[] = [
    { rank: 1, name: "Principiante", description: "" },
    { rank: 2, name: "Intermedio", description: "" },
    { rank: 3, name: "Avanzado", description: "" },
  ];
  const padel: SportLevel[] = ["8va", "7ma", "6ta", "5ta", "4ta", "3ra", "2da", "1ra"].map((name, i) => ({
    rank: i + 1,
    name,
    description: "",
  }));

  it("describe rangos de nivel", () => {
    expect(formatLevelRange(futbol, null, null)).toBe("Todos los niveles");
    expect(formatLevelRange(futbol, 1, 3)).toBe("Todos los niveles");
    expect(formatLevelRange(futbol, 2, 3)).toBe("Desde Intermedio");
    expect(formatLevelRange(futbol, 1, 2)).toBe("Hasta Intermedio");
    expect(formatLevelRange(futbol, 2, 2)).toBe("Intermedio");
    expect(formatLevelRange(padel, 3, 5)).toBe("6ta a 4ta");
  });
  it("describe rangos de edad", () => {
    expect(formatAgeRange(null, null)).toBe("Todas las edades");
    expect(formatAgeRange(25, 40)).toBe("25 a 40 años");
    expect(formatAgeRange(30, null)).toBe("+30 años");
    expect(formatAgeRange(null, 35)).toBe("Hasta 35 años");
  });
});

describe("formatos", () => {
  it("precio en pesos", () => {
    expect(formatPrice(0)).toBe("Gratis");
    expect(formatPrice(4500).replace(/\s/g, " ")).toBe("$ 4.500");
  });
  it("fechas relativas", () => {
    expect(formatDayLabel("2026-10-13T00:00:00Z", NOW)).toBe("Hoy");
    expect(formatDayLabel("2026-10-13T23:00:00Z", NOW)).toBe("Mañana");
    expect(formatMatchWhen("2026-10-16T00:00:00Z", NOW)).toBe("Jue 15 oct · 21:00");
  });
});

describe("whatsapp", () => {
  it("normaliza celulares argentinos", () => {
    expect(normalizeArMobile("342 412-3456")).toBe("5493424123456");
    expect(normalizeArMobile("0342 4123456")).toBe("5493424123456");
    expect(normalizeArMobile("+54 9 342 412 3456")).toBe("5493424123456");
    expect(normalizeArMobile("11 5555 4444")).toBe("5491155554444");
    expect(normalizeArMobile("4123456")).toBeNull();
  });
  it("formatea y arma el link", () => {
    expect(formatArMobile("5493424123456")).toBe("342 412-3456");
    expect(whatsappLink("5493424123456", "Hola! Soy Lu")).toBe(
      "https://wa.me/5493424123456?text=Hola!%20Soy%20Lu",
    );
  });
});
