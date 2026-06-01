import type { ReactNode } from "react";

import "./globals.css";

import { Providers } from "./providers";

export const metadata = {
  title: "AgentKernel",
  description: "A reusable agent workspace built on AgentKernel",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
