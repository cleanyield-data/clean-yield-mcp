# Image for directories that build and start the server (e.g. Glama).
# Starts and answers initialize / tools/list without any key (the five tools come from tools.json).
# Running a tool needs APIFY_TOKEN at runtime; calls are delegated to Apify's official
# MCP server, installed here so nothing is downloaded on first use.
FROM node:22-slim
WORKDIR /app
COPY package.json index.js tools.json README.md LICENSE ./
RUN npm install -g @apify/actors-mcp-server@0.20.2 --omit=dev --no-audit --no-fund
ENV APIFY_MCP_BIN=actors-mcp-server
ENTRYPOINT ["node", "index.js"]
