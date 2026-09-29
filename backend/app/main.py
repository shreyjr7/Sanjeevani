import sys
import os

# Ensure project root is in sys.path so 'ai' and 'backend' packages can be imported
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base
from .models import User, Case, CheckIn, RiskScore, Alert, Intervention, Message
from .routers import auth, cases, checkins, risks, alerts, history, interventions, stats, chat, governance

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="NHAA 14566 Dynamic Distress Monitoring & Atrocity Prevention API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(checkins.router)
app.include_router(risks.router)
app.include_router(alerts.router)
app.include_router(history.router)
app.include_router(interventions.router)
app.include_router(stats.router)
app.include_router(chat.router)
app.include_router(governance.router)

@app.get("/")
def root():
    return {"message": "Welcome to NovaFlow API"}
