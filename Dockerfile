FROM node:18-slim
LABEL org.opencontainers.image.authors="claire <claire@clairecampbell.io>"

# Copy source to /app and switch to node user
RUN mkdir /app
RUN chown node:node /app
COPY --chown=node:node ./ /app/
WORKDIR /app
USER node

# Install dependencies and build app
RUN npm config set update-notifier false
RUN npm install --silent
RUN npm run build
RUN npm prune --omit=dev

# Run
ENV NODE_ENV=production
ENTRYPOINT npm start
