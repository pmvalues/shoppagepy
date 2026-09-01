FROM node:20-slim AS builder

WORKDIR /app

# Copy workspace package manifests for cached dependency installation
COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/kernel/package.json ./packages/kernel/
COPY packages/adapters/package.json ./packages/adapters/
COPY packages/eval/package.json ./packages/eval/
COPY packages/config/package.json ./packages/config/
COPY apps/web/package.json ./apps/web/

RUN npm install --no-audit --no-fund && npm cache clean --force

# Copy source files
COPY . .

# Ensure public folder exists
RUN mkdir -p apps/web/public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV CI=1

# Compile monorepo packages and Next.js 16 App Router
RUN npm run build

# Strip builder caches and prune devDependencies to keep image size small
RUN rm -rf apps/web/.next/cache /root/.npm /root/.cache
RUN npm prune --production

FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Ensure public folder exists in runner
RUN mkdir -p apps/web/public

# Copy only production runtime artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/
COPY --from=builder /app/shoppage-commerce-intelligence-foundation ./shoppage-commerce-intelligence-foundation

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@shoppage/web", "--", "-p", "3000"]
