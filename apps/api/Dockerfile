FROM node:20-alpine

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN corepack enable && pnpm install
RUN pnpm --filter @publication/api build

WORKDIR /workspace/apps/api
EXPOSE 3001
CMD ["sh", "-c", "pnpm db:push && pnpm start"]
