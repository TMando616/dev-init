FROM node:20-alpine

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source code
COPY frontend/ .

EXPOSE 3000

# Use npx directly to avoid shell path issues
CMD ["npx", "next", "dev"]
