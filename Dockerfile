FROM node:24-alpine

ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=8080 \
    API_PROTOCOL=http

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY src ./src

EXPOSE 8080

USER node

CMD ["node", "src/index.js"]