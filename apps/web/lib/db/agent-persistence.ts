import "server-only";

import { createPrismaAgentPersistenceCore } from "./agent-persistence-core";
import { prisma } from "./prisma";

export function createPrismaAgentPersistence() {
  return createPrismaAgentPersistenceCore(prisma);
}
