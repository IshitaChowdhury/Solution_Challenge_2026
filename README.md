# Volnix AI

Volnix AI is a volunteer coordination platform for NGOs. It analyzes incoming needs with Gemini and matches volunteers based on skill and location, with data stored in Firebase Firestore.

## Tech Stack

- Frontend: React
- Backend: Node.js + Express
- AI: Google Gemini API
- Database: Firebase Firestore

## Prerequisites

- Node.js 18+
- Firebase service account credentials
- Gemini API key

## Run Locally

1. Start backend:

```bash
cd backend
npm install
npm start
```

2. Start frontend:

```bash
cd frontend
npm install
npm run dev
```

## Backend Environment

Create `backend/.env`:

```bash
PORT=4000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
```