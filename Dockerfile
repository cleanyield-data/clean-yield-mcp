# Minimal image for directories that build and start the server (e.g. Glama).
# Needs APIFY_TOKEN at runtime; the official Apify MCP server is fetched on start.
FROM node:22-slim
WORKDIR /app
COPY package.json index.js README.md LICENSE ./
RUN npm install -g @apify/actors-mcp-server@0.20.2 --omit=dev --no-audit --no-fund
ENV APIFY_MCP_BIN=actors-mcp-server
ENTRYPOINT ["node", "index.js"]
