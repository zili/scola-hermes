# Scuila - Système de Gestion Scolaire

Application web complète pour la gestion d'une école : étudiants, enseignants, inscriptions, absences, résultats et bulletins de notes.

## Stack Technique

- **Backend** : FastAPI + PostgreSQL + SQLAlchemy
- **Frontend** : Next.js 14 + TypeScript + TailwindCSS
- **Auth** : JWT

## Installation

```bash
# Backend
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Structure

```
scuila-hermes/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, DB, Security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── api/v1/        # Routes
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # Composants UI
│   │   └── lib/           # API client
│   └── package.json
└── SPEC.md
```

## License

MIT