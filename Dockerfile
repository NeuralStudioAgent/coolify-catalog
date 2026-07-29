FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js extras.json nt-apps.json ./
COPY public ./public
RUN mkdir -p /app/data
ENV PORT=3000
ENV DATA_DIR=/app/data
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", "server.js"]
