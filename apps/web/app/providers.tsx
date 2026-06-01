"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

import { copilotRuntimeUrl } from "../lib/copilot-config";
import {
  DEFAULT_MODEL,
  ModelSelectorProvider,
  type SupportedModelId,
} from "../lib/model-selector-context";

export function Providers({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<SupportedModelId>(DEFAULT_MODEL);
  const properties = useMemo(() => ({ model }), [model]);

  // enableInspector={false} hides the CopilotKit AG-UI inspector badge (the diamond +
  // announcement chrome) for a clean ChatGPT/DeepSeek-style surface.
  return (
    <ModelSelectorProvider value={{ model, setModel }}>
      <CopilotKit runtimeUrl={copilotRuntimeUrl} enableInspector={false} properties={properties}>
        {children}
      </CopilotKit>
    </ModelSelectorProvider>
  );
}
