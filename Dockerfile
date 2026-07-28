FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js extras.json nt-apps.json ./
COPY public ./public
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
