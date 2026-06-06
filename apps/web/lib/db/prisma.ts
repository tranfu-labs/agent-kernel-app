import "server-only";

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __agentKernelPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__agentKernelPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__agentKernelPrisma = prisma;
}
