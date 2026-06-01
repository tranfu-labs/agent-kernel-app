"use client";

import { createContext, useContext } from "react";

export type SupportedModelId = "claude-opus-4-7" | "gpt-5.5";

export interface ModelSelectorContextValue {
  model: SupportedModelId;
  setModel: (model: SupportedModelId) => void;
}

export const DEFAULT_MODEL: SupportedModelId = "claude-opus-4-7";

const ModelSelectorContext = createContext<ModelSelectorContextValue | null>(null);

export function ModelSelectorProvider({
  value,
  children,
}: {
  value: ModelSelectorContextValue;
  children: React.ReactNode;
}) {
  return <ModelSelectorContext.Provider value={value}>{children}</ModelSelectorContext.Provider>;
}

export function useModelSelector(): ModelSelectorContextValue {
  const value = useContext(ModelSelectorContext);
  if (!value) throw new Error("useModelSelector must be used within ModelSelectorProvider");
  return value;
}
