FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install expo globally to ensure it's available for build
RUN npm install -g expo@54.0.31

ARG EXPO_PUBLIC_API_BASE_URL
ARG EXPO_PUBLIC_KEYCLOAK_ISSUER
ARG EXPO_PUBLIC_KEYCLOAK_CLIENT_ID
ARG EXPO_PUBLIC_KEYCLOAK_TOKEN_URL
ARG EXPO_PUBLIC_SYSTEM_A_API_URL

ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_KEYCLOAK_ISSUER=$EXPO_PUBLIC_KEYCLOAK_ISSUER
ENV EXPO_PUBLIC_KEYCLOAK_CLIENT_ID=$EXPO_PUBLIC_KEYCLOAK_CLIENT_ID
ENV EXPO_PUBLIC_KEYCLOAK_TOKEN_URL=$EXPO_PUBLIC_KEYCLOAK_TOKEN_URL
ENV EXPO_PUBLIC_SYSTEM_A_API_URL=$EXPO_PUBLIC_SYSTEM_A_API_URL

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Allow NODE_ENV to be passed or default to production
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV PORT=3001

RUN npm i -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["sh", "-c", "serve dist -s --listen ${PORT:-3001}"]
