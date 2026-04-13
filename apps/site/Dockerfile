FROM node:20-alpine

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN corepack enable && pnpm install
RUN pnpm --filter @publication/site build

WORKDIR /workspace/apps/site
EXPOSE 3002
CMD ["pnpm", "start"]
