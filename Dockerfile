FROM node:18-alpine AS builder

WORKDIR /app

# Install required build dependencies
RUN apk add --no-cache python3 py3-pip make g++

# Copy package manifests and install all dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy over the entire repo
COPY . .

# Accept public env vars from build args
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_REALM
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ARG NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG
ARG NEXT_PUBLIC_ILLINOIS_CHAT_BANNER_CONTENT
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST

# Make them available during the build
ENV NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL
ENV NEXT_PUBLIC_KEYCLOAK_REALM=$NEXT_PUBLIC_KEYCLOAK_REALM
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID

# Illinois Chat specfic config
ENV NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG=$NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG
ENV NEXT_PUBLIC_ILLINOIS_CHAT_BANNER_CONTENT=$NEXT_PUBLIC_ILLINOIS_CHAT_BANNER_CONTENT

# posthog config
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

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
# the .env file is handled by docker-compose in the self-hostable repo: https://github.com/Center-for-AI-Innovation/self-hostable-uiuc-chat

ENV NODE_ENV=production

# Next.js defaults to port 3000
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "run", "start"]
