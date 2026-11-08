# Builds the React app, then runs the Express server, which serves it.
FROM node:22-slim AS client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY app.js index.js config.js ./
COPY database ./database
COPY middleware ./middleware
COPY routes ./routes
COPY scripts ./scripts
COPY --from=client /app/client/dist ./client/dist
# SQLite lives here; mount a persistent volume at /data.
ENV DB_PATH=/data/dropbag.db
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "index.js"]
