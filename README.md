# 🧠 NovaFlow — AI-Powered Mental Health Monitoring & Distress Prediction System

> **An AI-assisted system that periodically checks on victims/complainants, analyzes their responses and engagement patterns, tracks distress over time, identifies cases that may need attention, explains why a case was flagged, and helps authorized personnel coordinate appropriate support.**

⚠️ **Ethical Disclaimer**: This system provides AI-powered **decision-support signals** only. It does **NOT** claim to medically diagnose anyone. All risk scores and flags are advisory and must be reviewed by trained professionals.

---

## 📸 System Overview

### Architecture

```
  ┌─────────────────────────────────────────────────────────────────┐
  │              Frontend — React + Vite + Tailwind CSS             │
  │  Pages: Login │ Victim Dashboard │ Check-in │ Cases │ Details   │
  │         Alerts │ Intervention & AI Pipeline Sandbox             │
  └────────────────────────────┬────────────────────────────────────┘
                               │ REST API + JWT Auth
                               ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                     FastAPI Backend                              │
  │  Auth │ Cases │ Check-ins │ Risk │ Alerts │ History │ Stats     │
  └────────────────────────────┬────────────────────────────────────┘
                               │
              ┌────────────────┴───────────────┐
              ▼                                ▼
  ┌───────────────────────┐       ┌────────────────────────────────┐
  │  SQLite Database      │       │  AI/NLP Pipeline               │
  │  Users, Cases,        │       │  1. Text Preprocessing         │
  │  Check-ins, Scores,   │       │  2. VADER Sentiment Analysis   │
  │  Alerts, Interventions│       │  3. Emotion Detection (7-class)│
  └───────────────────────┘       │  4. Clinical Distress Lexicon  │
                                  │  5. Composite Risk Scoring     │
                                  │  6. Explainable AI (XAI)       │
                                  └────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **pip** (Python package manager)

### 1. Clone & Install

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
pip install -r requirements.txt
```

### 2. Generate Synthetic Data

```bash
cd data
python generate_data.py
```

### 3. Seed Database

```bash
cd backend
python seed_data.py
```

### 4. Start Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

The app will be available at **http://localhost:5173**

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Victim | victim@demo.com | demo1234 |
| Counsellor | counsellor@demo.com | demo1234 |

---

## 📄 Pages

| # | Page | Route | Role | Description |
|---|------|-------|------|-------------|
| 1 | **Login** | `/login` | All | Authentication with role selection |
| 2 | **Victim Dashboard** | `/dashboard` | Victim | Wellness score, trend graph, check-in history |
| 3 | **Check-In** | `/check-in` | Victim | Guided questionnaire + free-text journal |
| 4 | **Case Dashboard** | `/cases` | Counsellor | Triage table with risk levels, search, filters |
| 5 | **Case Details** | `/cases/:id` | Counsellor | Full timeline, AI analysis, trend charts |
| 6 | **Alerts** | `/alerts` | Counsellor | Real-time alert feed with severity levels |
| 7 | **Intervention Pipeline** | `/intervention` | Counsellor | Intervention management + AI pipeline sandbox |
| 8 | **Interactive Care Hub** | `/chat` | All | 24/7 Sarajeevi AI Companion, Doctor Direct Chat, Visual 4-7-8 Breathing Pacer |

---

## 🤖 AI/NLP Pipeline

The system processes check-in text through a 6-stage pipeline:

```
Text Input → Preprocessing → Sentiment → Emotion → Features → Risk Score → XAI
```

### Risk Scoring Formula

$$R = \min(100, \; \alpha \cdot S_{sentiment} + \beta \cdot E_{emotion} + \gamma \cdot L_{lexicon} + \delta \cdot T_{temporal})$$

Where α=0.25, β=0.35, γ=0.25, δ=0.15

### Risk Tiers

| Score | Tier | Color | Recommended Action |
|-------|------|-------|--------------------|
| 0-29 | Low | 🟢 Emerald | Positive reinforcement |
| 30-59 | Moderate | 🟡 Amber | Continue monitoring |
| 60-79 | High | 🟠 Orange | Priority caseworker review |
| 80-100 | Critical | 🔴 Crimson | Immediate alert + crisis resources |

### Crisis Safety Override

If self-harm or suicidal ideation keywords are detected, the risk score is immediately set to **max(R, 95)** — triggering CRITICAL tier regardless of other factors.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | FastAPI + SQLAlchemy + SQLite |
| Auth | JWT (PyJWT + passlib[bcrypt]) |
| NLP | VADER Sentiment + Rule-based Emotion Detection |
| Risk Model | Composite weighted formula + crisis override |
| XAI | Template-driven rationale + token attribution |

---

## 📁 Project Structure

```
novaFlow1/
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── pages/      # 7 main pages
│   │   ├── components/ # UI, layout, chart components
│   │   ├── context/    # Auth context
│   │   ├── services/   # API service layer
│   │   └── data/       # Mock data
│   └── package.json
│
├── backend/            # FastAPI application
│   ├── app/
│   │   ├── models/     # SQLAlchemy ORM models
│   │   ├── schemas/    # Pydantic schemas
│   │   ├── routers/    # API route handlers
│   │   └── middleware/ # Auth middleware
│   └── seed_data.py
│
├── ai/                 # AI/NLP Pipeline
│   ├── preprocessing.py
│   ├── sentiment.py
│   ├── emotion.py
│   ├── features.py
│   ├── risk_model.py
│   ├── explainer.py
│   └── pipeline.py
│
├── data/               # Synthetic dataset
│   ├── generate_data.py
│   └── synthetic_dataset.json
│
└── README.md
```

---

## ⚖️ Ethical Guidelines

1. **No Medical Diagnosis**: This system provides decision-support signals only
2. **Human Oversight**: All AI outputs must be reviewed by qualified professionals
3. **Synthetic Data**: All demo data is entirely fictional
4. **Crisis Safety**: Explicit safety overrides for self-harm detection
5. **Privacy**: All processing runs locally — no data sent to external services
6. **Transparency**: XAI provides human-readable explanations for every assessment

---

## 📜 License

This project is for educational and demonstration purposes.

Built with ❤️ for mental health awareness and support.
