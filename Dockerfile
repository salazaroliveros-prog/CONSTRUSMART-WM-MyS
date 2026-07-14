# Stage 1: Dependencies
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
LABEL maintainer="construsmart" version="0.1.0"

# Copy production dependencies from stage 1
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built app from stage 2
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "run", "preview"]
