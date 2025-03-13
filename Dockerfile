FROM node:18-alpine AS builder

WORKDIR /app

# Install required build dependencies
RUN apk add --no-cache python3 py3-pip make g++

# Copy package manifests and install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy over the entire repo
COPY . .

# Build Next.js production assets
RUN npm run build:self-hosted

# ---- 2) Runner Stage ----
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only what’s needed for runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/next-i18next.config.mjs ./
COPY --from=builder /app/src ./
COPY --from=builder /app/.env ./ 
# ^ the .env file is created by the self-hostable-backend repo, in init.sh

ENV NODE_ENV=production

# Next.js defaults to port 3000
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "run", "start"]
