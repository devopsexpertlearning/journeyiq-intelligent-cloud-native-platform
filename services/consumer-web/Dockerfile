FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Accept build arguments for NEXT_PUBLIC environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:8001
ARG NEXT_PUBLIC_USER_URL=http://localhost:8002
ARG NEXT_PUBLIC_SEARCH_URL=http://localhost:8003
ARG NEXT_PUBLIC_PRICING_URL=http://localhost:8004
ARG NEXT_PUBLIC_INVENTORY_URL=http://localhost:8005
ARG NEXT_PUBLIC_BOOKING_URL=http://localhost:8006
ARG NEXT_PUBLIC_PAYMENT_URL=http://localhost:8007
ARG NEXT_PUBLIC_TICKETING_URL=http://localhost:8008
ARG NEXT_PUBLIC_NOTIFICATION_URL=http://localhost:8009
ARG NEXT_PUBLIC_REVIEW_URL=http://localhost:8010
ARG NEXT_PUBLIC_ANALYTICS_URL=http://localhost:8011
ARG NEXT_PUBLIC_AI_AGENT_URL=http://localhost:8012
ARG NEXT_PUBLIC_IOT_URL=http://localhost:8013
ARG NEXT_PUBLIC_ADMIN_URL=http://localhost:8014

# Set as environment variables for the build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_USER_URL=$NEXT_PUBLIC_USER_URL
ENV NEXT_PUBLIC_SEARCH_URL=$NEXT_PUBLIC_SEARCH_URL
ENV NEXT_PUBLIC_PRICING_URL=$NEXT_PUBLIC_PRICING_URL
ENV NEXT_PUBLIC_INVENTORY_URL=$NEXT_PUBLIC_INVENTORY_URL
ENV NEXT_PUBLIC_BOOKING_URL=$NEXT_PUBLIC_BOOKING_URL
ENV NEXT_PUBLIC_PAYMENT_URL=$NEXT_PUBLIC_PAYMENT_URL
ENV NEXT_PUBLIC_TICKETING_URL=$NEXT_PUBLIC_TICKETING_URL
ENV NEXT_PUBLIC_NOTIFICATION_URL=$NEXT_PUBLIC_NOTIFICATION_URL
ENV NEXT_PUBLIC_REVIEW_URL=$NEXT_PUBLIC_REVIEW_URL
ENV NEXT_PUBLIC_ANALYTICS_URL=$NEXT_PUBLIC_ANALYTICS_URL
ENV NEXT_PUBLIC_AI_AGENT_URL=$NEXT_PUBLIC_AI_AGENT_URL
ENV NEXT_PUBLIC_IOT_URL=$NEXT_PUBLIC_IOT_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
