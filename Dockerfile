# Build "multi-étapes" : une première image construit l'app, une seconde (plus légère) la sert.

# --- Étape 1 : construire l'app avec Node ---
FROM docker.io/library/node:24-alpine AS build
WORKDIR /app
# On copie d'abord package*.json seuls : si les dépendances ne changent pas,
# Docker réutilise ce "npm ci" déjà fait (cache), et le build est plus rapide.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# On lance les tests avant de construire : si un test échoue, l'image n'est pas créée.
RUN npm test && npm run build

# --- Étape 2 : servir les fichiers construits avec nginx, sans root (R24) ---
# OpenShift lance le conteneur avec un utilisateur aléatoire non-root :
# cette image de nginx est prévue pour ça et écoute sur le port 8080.
FROM docker.io/nginxinc/nginx-unprivileged:1.29-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
