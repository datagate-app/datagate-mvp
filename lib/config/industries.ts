export const INDUSTRIES = {
  manufacturing: "Produkcja",
  it: "Technologie / IT",
  retail: "Handel",
  services: "Usługi",
  construction: "Budownictwo",
} as const;

export type IndustryKey = keyof typeof INDUSTRIES;