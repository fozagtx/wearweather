import rawCatalogue from "@/data/catalogue.json";
import type { LookCatalogRecord } from "./types";

export const catalogue = rawCatalogue as LookCatalogRecord[];

export function getActiveCatalogue() {
  return catalogue.filter((look) => look.active);
}

export function getLookById(id: string) {
  return catalogue.find((look) => look.id === id && look.active);
}
