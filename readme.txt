# ArabiQ — Plateforme d'apprentissage de l'arabe

> Maîtrisez l'arabe, une lettre à la fois.

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styles | TailwindCSS |
| État | Zustand + React Query |
| i18n | i18next (FR / ES / EN) |
| Backend | FastAPI (Python 3.11) |
| Base de données | PostgreSQL 16 + pgvector |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens) |
| Migrations | Alembic |
| Conteneurs | Docker Compose |

## Structure du projet

```
arabic-platform/
├── frontend/
│   ├── src/
│   │   ├── types/          # Types TypeScript globaux
│   │   ├── store/          # Zustand (auth, progress)
│   │   ├── lib/            # apiClient (Axios + intercepteurs)
│   │   ├── services/       # authService, curriculumService
│   │   ├── hooks/          # useAuth
│   │   ├── i18n/           # Traductions FR/ES/EN
│   │   └── pages/          # LoginPage, DashboardPage, ...
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── core/           # config.py, security.py
│   │   ├── db/             # session.py (engine + get_db)
│   │   ├── models/         # SQLAlchemy ORM
│   │   ├── schemas/        # Pydantic (auth, curriculum)
│   │   ├── api/
│   │   │   ├── deps.py     # get_current_user
│   │   │   └── v1/
│   │   │       ├── router.py
│   │   │       └── endpoints/
│   │   │           ├── auth.py
│   │   │           └── curriculum.py
│   │   └── main.py
│   ├── migrations/versions/0001_initial.py
│   ├── tests/test_auth.py
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml
```

## Démarrage rapide

### 1. Prérequis
- Docker Desktop ≥ 4.x
- Node.js 20+ (pour développement local frontend)
- Python 3.11+ (pour développement local backend)

### 2. Lancement via Docker Compose

```bash
# Cloner le projet
git clone <repo> && cd arabic-platform

# Copier et configurer les variables d'environnement
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos clés API

# Lancer la stack complète
docker compose up -d

# Vérifier les logs
docker compose logs -f backend
```

L'API sera disponible sur `http://localhost:8000/docs`
Le frontend sur `http://localhost:3000`

### 3. Développement local (sans Docker)

**Backend :**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Lancer PostgreSQL et Redis séparément (ou via docker compose up postgres redis)
uvicorn app.main:app --reload --port 8000
```

**Frontend :**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.local
npm run dev
```

### 4. Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx aiosqlite
pytest tests/ -v
```

## API — Endpoints Phase 1

### Auth
| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Inscription |
| POST | `/api/v1/auth/login` | Connexion |
| POST | `/api/v1/auth/refresh` | Rafraîchir le token |
| GET | `/api/v1/auth/me` | Profil utilisateur |
| POST | `/api/v1/auth/logout` | Déconnexion |

### Curriculum
| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/curriculum/modules` | Liste des modules |
| GET | `/api/v1/curriculum/modules/{id}` | Détail module + cours |
| GET | `/api/v1/curriculum/lessons/{id}` | Leçon avec exercices |
| POST | `/api/v1/curriculum/lessons/{id}/complete` | Valider une leçon |
| GET | `/api/v1/curriculum/next-lesson` | Prochaine leçon recommandée |
| GET | `/api/v1/curriculum/progress` | Progression globale |

## Feuille de route

- **Phase 1** ✅ Setup, Auth, Module 1, Dashboard
- **Phase 2** — LLM (GPT-4), Whisper ASR, Gamification complète
- **Phase 3** — Visualisation phonétique 3D (Three.js), DKT (PyTorch), Multilingue ES/EN
- **Phase 4** — Stripe, Kubernetes, Admin panel, Modules 7–12

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `SECRET_KEY` | Clé JWT (changer en prod !) | `change-me-...` |
| `DATABASE_URL` | URL PostgreSQL asyncpg | localhost:5432 |
| `REDIS_URL` | URL Redis | localhost:6379 |
| `OPENAI_API_KEY` | Clé OpenAI (Phase 2) | — |
| `ANTHROPIC_API_KEY` | Clé Anthropic (Phase 2) | — |
| `ELEVENLABS_API_KEY` | Synthèse vocale (Phase 2) | — |