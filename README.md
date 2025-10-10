# BSC Scouting — README

> **Note** : Tout ce qui touche à FFmpeg et S3 sera optionnel dans un premier temps. Si une solution pour trouver les fichiers `.rofl` est trouvée, alors nous l'implémenterons, sinon c'est chaud dehors.

Un **monolithe 100% TypeScript** pour une app de scouting communautaire League of Legends : profils joueurs, double notation (experts vs public), tags, clips, suivi mercato, comparaison, et ingestion multi-sources (Riot, Leaguepedia, GRID…).

---

## 🎯 Objectif

Construire **une app de scouting (communautaire)** — pas une énième app de data :

- **Profil joueur** : identité, ranks (rank/top rank), ligue, pays, langues, équipe & fin de contrat, liens (OPGG, DPM, Liquipedia…), **tags** ("OTP", "Utilitaire", "Aggressif", "Drama", "Sioniste", ...).
- **Notation à la RottenTomatoes** :
    - **Experts** (validés) : note + justification (texte, PDF/diapo).
    - **Public** (bronzes) : note séparée + commentaire.
    - **Réputation** → promotion auto en “expert” si contributions concordantes.
- **Votes & mise en avant** : like/“validé”, tendances (semaine, nouveaux profils), filtres par tags.
- **Clips & gameplay** : extraits ajoutés par les scouts (upload direct S3 → transcodage FFmpeg → lecture HLS).
- **Historique type Transfermarkt** : équipes/rosters/coach, titres, rumeurs & suivi de dossier.
- **Notifications** : suivi joueurs (rumeur, fin de contærat, live).
- **Ingestion** : Riot Dev API, Leaguepedia/Liquipedia, LoL Esports, Twitch/YouTube, GRID (si on arrive à gratter un compte).

---
## 🤝 Participer au projet

Processus simple pour contribuer avec des branches propres, commits normalisés et githooks activés.

- Point de départ : créez toujours votre branche depuis `main`.
- Nommages des branches: utilisez l'un des préfixes suivants :
  - `feat/` pour une nouvelle fonctionnalité
  - `fix/` pour une correction de bug
  - `docs/` pour des modifications de documentation
  - `style/` pour des changements de style (formatage, espaces, etc.)
  - `refactor/` pour des refactorisations de code
  - `test/` pour des ajouts ou modifications de tests
  - `chore/` pour des tâches diverses (mise à jour de dépendances, scripts, etc.)
  - `ci/` pour des modifications liées à l'intégration continue
  - `perf/` pour des améliorations de performance
  - `integration/` pour des branches liées à l'intégration avant une fusion

**Créer une branche**

```bash
# Depuis main
git checkout main
git pull origin main

# Créez une nouvelle branche avec le préfixe approprié
git checkout -b feat/ma-nouvelle-fonctionnalite
```

**Commits - Conventional Commits**

Respectez le format: `<type>(<scope>): <message>`
Types usuels: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `integration`
Référez-vous à https://www.conventionalcommits.org/fr/v1.0.0/ 

Exemples:
- `feat(auth): ajouter la connexion OAuth`
- `fix(api): corriger le bug de pagination`
- `docs(readme): mettre à jour les instructions d'installation`
- `test(api): couvrir GET /api/players`

**Installer les githooks**

Exécuter le script d’installation des hooks pour valider automatiquement le format des commits et lancer les checks locaux.

```bash
# Rendre exécutable et lancer le script d'installation
chmod +x scripts/setup-githooks.sh
./scripts/setup-githooks.sh
```

Après installation:
- Le hook `commit-msg` valide le format Conventional Commits.
- Le hook `pre-commit` peut lancer `lint/typecheck/test` selon la configuration.

**Vérifications locales**

```bash
bun run lint
bun run typecheck
bun run test
```

**Ouvrir une PR**

```bash
git push -u origin feature/ajout_page_profil
# Ouvrir une Pull Request vers la branche souhaiter sur GitHub
```

---

## 🧱 Stack (Monolithe React)

**Front (SPA)**
- React + Vite (dev & build avec Bun)
- React Router, TanStack Query
- Tailwind + shadcn/ui
- Recharts (Graphique)
- Service Worker (Web Push)

**Back (Monolithe TS)**
- **Hono** (HTTP basé Fetch) sur **Bun**
- **Prisma ≥ 5.12** ↔ **PostgreSQL 18**
- **Redis 8.2.2** (sessions, rate-limit, compteurs)
- **BullMQ** (jobs) + bull-board (dashboard) — via **ioredis**
- **BetterAuth** (OAuth Discord/Google) — cookies signés
- **S3-compatible** (Scaleway/OVH/Wasabi) pour médias
- **FFmpeg** (transcodage HLS + thumbnails), spawn via Bun

**Ops**
- Docker + **Nginx 1.29** (reverse proxy + statiques)
- CI GitHub Actions (lint/test/build/migrate/quality)

---

## 🗂️ Monorepo

```
frontend/              # React + Vite (SPA)
    src/
    public/
    index.html
    vite.config.ts
    Dockerfile         # Nginx 1.29-Alpine 

backend/               # Hono (API) + workers BullMQ sur Bun
    src/
        api/               # Routes et contrôleurs Hono
        workers/           # BullMQ workers (ingestion, transcode, notifs)
        lib/               # Utilitaires (db, auth, storage, rbac)
        clients/           # SDK Riot, Leaguepedia, Twitch, GRID, LoL Esports
    Dockerfile         # Alpine 3.21 + binaire compilé

db/
    init/              # Scripts d'init PostgreSQL (extensions, index)
        001_extensions.sql
        002_index.sql
    schema.prisma      # Schéma Prisma

docker-compose.yml     # Docker Compose (postgres, redis, frontend, backend)
    
scripts/             # Scripts divers (seed, migrate, etc.)
```
---

## 🗄️ Base de données

**PostgreSQL 18** avec les extensions suivantes (chargées automatiquement) :
* `pgcrypto` : fonctions cryptographiques
* `pg_trgm` : recherche trigramme pour recherche floue
* `unaccent` : normalisation des accents
* `citext` : colonnes texte insensibles à la casse

Schéma Prisma : voir [`db/schema.prisma`](db/schema.prisma)

Principales entités :
* `User + UserRole` : utilisateurs avec rôles multiples (COMMUNITY, EXPERT, ADMIN)
* `Player + ProspectProfile` : profils joueurs avec statut de validation
* `Tag + PlayerTag` : système de tags avec traçabilité
* `Vote` : votes avec idempotence (unique par user/player/type)
* `Review` : évaluations expert/public avec attachements S3
* `MediaClip` : clips vidéo avec état de transcodage
* `StatSnapshot` : statistiques multi-sources avec historique
* `PlayerHistory` : historique de carrière type Transfermarkt
* `Follow` : suivi de joueurs pour notifications
* `Submission` : soumissions communautaires en modération
* `AuditLog` : journal d'audit des actions sensibles
---

## 🐳 Images Docker 

**Backend** : `oven/bun:alpine` (build) → `alpine:3.21` (runtime)
* Compilation en binaire standalone avec `bun build --compile`
* Variables d'environnement injectées au build-time dans `generated-env.ts`

**Frontend** : `oven/bun:alpine` (build) → `nginx:1.29-alpine` (runtime)
* Build Vite optimisé avec variables d'environnement `VITE_*`
* Serveur Nginx non-root (user `nginx`)

**PostgreSQL** : `postgres:18`
* Extensions PostgreSQL chargées automatiquement via `/docker-entrypoint-initdb.d`

**Redis** : `redis:8.2.2`
* Configuration avec persistence (AOF + RDB)
* Politique d'éviction allkeys-lru
---
## ▶️ Démarrage rapide (Docker Compose)

```bash
# Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos valeurs

# Lancer les services
docker compose up -d

# Vérifier les logs
docker compose logs -f

# Arrêter les services
docker compose down
```

**Accès**
- Front SPA : `http://localhost/`
- API health : `http://localhost/api/health`
- API Backend : `http://localhost:8081`
---
## ▶️ Démarrage en local (sans Docker, Bun requis)
```bash
# Installer Bun https://bun.sh
bun --version

# Installer les dependances
bun install

# Prisma
bunx prisma generate --schema db/schema.prisma
bunx prisma migrate dev --schema db/schema.prisma
bunx prisma db seed --schema db/schema.prisma

# Lancer en développement (backend + frontend en parallèle)
bun run dev

# Ou séparément
bun run dev:backend  # http://localhost:3000
bun run dev:frontend # http://localhost:5173
```

**Accès**
- Front SPA : `http://localhost/`
- API health : `http://localhost/api/health`
- API Backend : `http://localhost:8081`
---


## 🔌 Endpoints (extraits)

- `GET /api/players?query=&role=&region=&tag=&sort=`
- `GET /api/players/:id` (profil + stats + liens + clips)
- `POST /api/players/:id/votes` *(rate-limit + idempotence via Redis)*
- `POST /api/players/:id/reviews` *(expert/public, pièces jointes S3)* 
- `POST /api/players/:id/tags` / `DELETE /api/players/:id/tags/:tagId`
- `GET /api/compare?A=id&B=id&metrics=kda,dpm,csPerMin`
- `POST /api/players/:id/clips:signed-url` → **PUT** direct S3 depuis le navigateur
- `POST /api/webhooks/storage` → enqueue `media.transcode(clipId)`

**Convention** : toutes les mutations exigent session OAuth (Discord/Google) et passent par **RBAC** + **rate-limit Redis** + **idempotency key**.

---

## 🔁 Jobs & ingestion (BullMQ)

**Queues** : `grid`, `riot`, `leaguepedia`, `media`, `notifs`  
**Repeatable jobs** :
- `ingest.riot.*` (delta) — 15 min
- `ingest.leaguepedia.rosters` — 6 h
- `ingest.esports.schedule` — 1 h
- `twitch.status` — 5 min
- `reputation.evaluate` — 1 h
- `leaderboards.recompute` — 15 min

---

## 🛡️ Sécurité & anti-abus

- OAuth (Discord/Google) via BetterAuth → cookies **HTTP-only**.
- **RBAC** + **réputation** (promotion auto “expert”).
- **Rate-limit** IP+user (Redis), **idempotency keys** (votes, webhooks).
- **Audit log** des modérations.
- **Sanitisation** des liens externes (dpm/liquipedia/twitter).

---

## ⚙️ Notes de compatibilité **Bun**

- **Prisma** : utilisez **Prisma ≥ 5.12** (ou version actuelle compatible Bun). `bunx prisma generate` & `migrate` OK.
- **BullMQ / ioredis** : compatibles sous Bun (Node-API support). Prenez des versions récentes.
- **Vite** : lancé via Bun (`bunx --bun vite).
- **Modules natifs** : vérifiez la compatibilité Bun si vous en ajoutez.

---

## 🧪 Qualité & scripts

```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && bun run dev\" \"cd frontend && bun run dev\"",
    "build": "bun run build:backend && bun run build:frontend",
    "lint": "biome lint",
    "format": "biome format",
    "format:fix": "biome format --write",
    "lint:fix": "biome lint --write",
    "check": "biome check",
    "check:fix": "biome check --write",
    "checks:ci": "bun run typecheck && biome ci",
    "typecheck": "tsc --build --pretty ./tsconfig.base.json",
    "prisma:gen": "bunx prisma generate --schema db/schema.prisma",
    "prisma:migrate:dev": "bunx prisma migrate dev --schema db/schema.prisma",
    "prisma:migrate:deploy": "bunx prisma migrate deploy --schema db/schema.prisma",
    "prisma:seed": "bunx prisma db seed --schema db/schema.prisma"
  }
}
```

---

## 🧭 Roadmap MVP

1. Ingestion Riot + Leaguepedia (snapshots, rosters)
2. Liste & fiche joueur (liens rapides, tags, votes)
3. Reviews public/expert + réputation
4. Comparateur 2 joueurs (normalisation rôle & patch)
5. Upload clips S3 → transcodage HLS → lecture
6. Suivi de dossier (rumeurs/officiel) + notifications

---

## 📜 Licence

Apache License 2.0
