FROM node:22-alpine AS base
WORKDIR /app
COPY --chmod=0644 package.json package-lock.json ./

FROM base AS test
RUN npm ci --no-audit --no-fund
COPY src ./src
COPY tests ./tests
COPY tdd ./tdd
COPY scripts ./scripts
COPY database ./database
COPY compose*.yaml ./
COPY .github/workflows ./.github/workflows
COPY jest*.cjs ./
CMD ["npm", "run", "test:coverage"]

FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force
COPY --chown=node:node src ./src
COPY --chown=node:node scripts/migrate.js scripts/preflight-deploy.js ./scripts/
COPY --chown=node:node database/migrations ./database/migrations
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
