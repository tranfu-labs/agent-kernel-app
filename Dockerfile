FROM node:22-slim AS base
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV COPILOTKIT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/agent-api/package.json apps/agent-api/package.json
COPY packages/agent-kernel/package.json packages/agent-kernel/package.json
COPY packages/agui-bridge/package.json packages/agui-bridge/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/storage/package.json packages/storage/package.json

RUN npm ci

FROM base AS builder

ENV DATABASE_URL=file:../data/agent-kernel-prod.db

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY . .

RUN npm run db:generate
RUN npm run build -- --force
RUN test -f packages/agent-kernel/dist/index.js \
  && test -f packages/agui-bridge/dist/index.js
RUN npm run web:build

FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=file:../data/agent-kernel-prod.db

COPY --from=builder /app ./

RUN mkdir -p /app/apps/web/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" || exit 1

CMD ["sh", "-c", "npm run db:deploy && npm --workspace @agentkernel/web start"]
