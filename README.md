# WorkFlow ⚡

**An AI-Powered, Role-Based Employee Task & Accountability Platform.**

Replaces spreadsheets and scattered chat updates with a single, structured, transparent
system where every task, update and outcome is tracked, verifiable, and attributed —
enhanced by an AI layer (Google Gemini) that verifies work logs and keeps managers informed.

## Stack
- **React** (Vite) — frontend
- **Node + Express** — backend (the AI layer)
- **Firebase Auth** — email/password authentication & roles
- **Cloud Firestore** — real-time data store (`onSnapshot` live updates)
- **Google Gemini** — AI work-log verification, team summaries, smart suggestions

> The Express backend owns the Gemini key and the AI endpoints; the React client talks to
> Firestore directly for real-time task tracking. Express verifies each request's Firebase
> ID token via Google's Identity Toolkit, so **no service-account key is required**.

---

## Setup

### 1. Configure environment
The repo expects a `.env` in the project root (already gitignored — never commit it):

```bash
GEMINI_API_KEY=your_gemini_key          # required for AI features
GEMINI_MODEL=gemini-2.0-flash           # optional
FIREBASE_API_KEY=AIzaSyCx1HISQk4RQaR5UDN4oljdoFV7tNdwXyg   # public web key, for token verification
PORT=5000
```
See `.env.example`. (The Firebase **web** config in `client/src/firebase.js` is public by
design — it identifies the project and is safe to commit. The Gemini key is the secret.)

### 2. Publish Firestore security rules
In the Firebase console → **Firestore Database → Rules**, paste the contents of
[`firestore.rules`](./firestore.rules) and **Publish**. This enforces role-based access.

### 3. Install & run
```bash
npm run install:all     # installs root + server + client deps
npm run dev             # runs Express (:5000) and Vite (:5173) together
# open http://localhost:5173
```

Or run them separately:
```bash
npm --prefix server run dev      # backend on :5050
npm --prefix client run dev      # frontend on :5173 (proxies /api → :5050)
```

### Production build
```bash
npm run build       # builds the React app into client/dist
npm start           # Express serves the API + the built client on :5050
```

---

## Using it
1. **Create a Manager account** (register, pick the Manager role).
2. **Register Employees** — they automatically join the first manager's team.
3. As a manager: **Assign task** (with priority + deadline; try **✦ Suggest** for AI triage),
   watch the dashboard update in real time, and hit **Where's My Team?** for an AI briefing.
4. As an employee: open a task, set its status, and **submit a daily work log** — the AI
   verifies it against the task and shows a verdict + confidence score.

## Feature → requirement map
| Requirement | Where |
|---|---|
| Role-based access | Firebase Auth + `role` on the user profile; manager/employee UIs |
| Real-time task tracking | Firestore `onSnapshot` listeners (`client/src/data.js`) |
| Daily work logs | task drawer → log composer |
| Overdue alerts | derived + highlighted across dashboard/tasks |
| Timestamped audit trail | `audit` collection, append-only, per-task + global feed |
| AI work-log verification | `POST /api/ai/verify-log` (Gemini) |
| Manager summary | `POST /api/ai/team-summary` (Gemini) |
| Smart suggestions | `POST /api/ai/suggest` (Gemini) |

## Project layout
```
.env / .env.example      secrets (gitignored) / template
firestore.rules          Firestore security rules (publish in console)
package.json             root scripts (install:all, dev, build, start)
server/                  Express backend (AI layer + token verification)
  index.js
client/                  React + Vite frontend
  src/firebase.js        Firebase init
  src/data.js            Firestore real-time data layer
  src/api.js             calls to the Express AI endpoints
  src/components/        Auth, Shell, views, TaskDrawer, AssignModal
```
