# Stage 1: Install dependencies and build the project
FROM node:22-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to install dependencies
COPY app/package.json app/package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY ./app .


ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
# Build the Next.js project
RUN npm run build

# Stage 2: Run the built project
FROM node:22-alpine AS runner

# Set NODE_ENV to production
ENV NODE_ENV=production

# Set working directory for the built app
WORKDIR /app

# Copy only the build artifacts from the previous stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Install only production dependencies
RUN npm install --omit=dev

# Expose the port that Next.js runs on (default is 3000)
EXPOSE 3000
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

# Start the Next.js app
CMD ["npm", "run", "start"]
