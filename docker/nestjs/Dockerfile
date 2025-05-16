FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/users-service/prisma ./apps/users-service/prisma
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod
RUN pnpm prisma generate --schema=./apps/users-service/prisma/schema.prisma

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm fetch --frozen-lockfile
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate --schema=./apps/users-service/prisma/schema.prisma
RUN pnpm build

FROM base
WORKDIR /app
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=build /app/apps/users-service/prisma /app/apps/users-service/prisma
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
ENV NODE_ENV production
ENTRYPOINT pnpm migration:prod && pnpm start:prod
