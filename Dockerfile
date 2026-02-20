FROM node:20-slim

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
COPY frontend/ ./frontend/

ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "backend/server.js"]
