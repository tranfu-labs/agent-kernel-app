export const PRISM_OLD_ROOT = "/Users/griffith/Projects/Prism_old";

export interface PrismOldAdapterStatus {
  root: string;
  mode: "planned" | "active";
  notes: string[];
}

export function getPrismOldAdapterStatus(): PrismOldAdapterStatus {
  return {
    root: PRISM_OLD_ROOT,
    mode: "planned",
    notes: [
      "This adapter will wrap selected Prism_old Python capabilities instead of migrating the full old runtime.",
      "Initial priority: market data, Polymarket clients, wallet engine, and artifact persistence.",
    ],
  };
}
