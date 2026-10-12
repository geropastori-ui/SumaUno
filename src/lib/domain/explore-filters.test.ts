import { describe, expect, it } from "vitest";
import { dayRange, filtersToQuery, parseFilters } from "./explore-filters";

// Miércoles 14/10/2026 15:00 en Argentina
const WED = new Date("2026-10-14T18:00:00Z");
// Sábado 17/10/2026 15:00 en Argentina
const SAT = new Date("2026-10-17T18:00:00Z");

describe("filtros de explorar", () => {
  it("ida y vuelta por la URL", () => {
    const f = parseFilters({ ciudad: "santa-fe", deporte: "padel", nivel: "3-5", edad: "25-", dia: "finde" });
    expect(f).toMatchObject({ city: "santa-fe", sports: ["padel"], levelMin: 3, levelMax: 5, ageMin: 25, ageMax: null, day: "finde" });
    expect(parseFilters(Object.fromEntries(new URLSearchParams(filtersToQuery(f))))).toEqual(f);
  });
  it("descarta el nivel si hay más de un deporte", () => {
    const f = parseFilters({ deporte: "padel,futbol-5", nivel: "1-2" });
    expect(f.levelMin).toBeNull();
  });
  it("ignora valores inválidos", () => {
    const f = parseFilters({ ciudad: "<script>", nivel: "5-1", edad: "10-200", dia: "ayer" });
    expect(f).toMatchObject({ city: null, levelMin: null, ageMin: null, day: null });
  });
});

describe("rangos de días", () => {
  it("hoy y mañana", () => {
    expect(dayRange("hoy", WED)).toEqual({ from: null, to: "2026-10-15T03:00:00.000Z" });
    expect(dayRange("manana", WED)).toEqual({ from: "2026-10-15T03:00:00.000Z", to: "2026-10-16T03:00:00.000Z" });
  });
  it("finde desde un día de semana", () => {
    expect(dayRange("finde", WED)).toEqual({ from: "2026-10-17T03:00:00.000Z", to: "2026-10-19T03:00:00.000Z" });
  });
  it("finde estando en sábado arranca ahora", () => {
    expect(dayRange("finde", SAT)).toEqual({ from: null, to: "2026-10-19T03:00:00.000Z" });
  });
  it("fecha puntual", () => {
    expect(dayRange("2026-10-20", WED)).toEqual({ from: "2026-10-20T03:00:00.000Z", to: "2026-10-21T03:00:00.000Z" });
  });
});
