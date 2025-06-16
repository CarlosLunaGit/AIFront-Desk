# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_URL
ARG VITE_ENABLE_MOCK_API
ARG VITE_STRIPE_PUBLISHABLE_KEY

# Set environment variables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_MOCK_API=$VITE_ENABLE_MOCK_API
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-user
RUN adduser -S frontend -u 1001 -G nginx-user

# Change ownership
RUN chown -R frontend:nginx-user /usr/share/nginx/html
RUN chown -R frontend:nginx-user /var/cache/nginx
RUN chown -R frontend:nginx-user /var/log/nginx

# Switch to non-root user
USER frontend

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 