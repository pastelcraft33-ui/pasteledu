FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libreoffice-impress fonts-noto-cjk fonts-liberation python3-pypdf poppler-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server.mjs ./
USER node
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.mjs"]
