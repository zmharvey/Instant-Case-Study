import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import db
from api.routes import jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.create_pool()
    yield
    await db.close_pool()


app = FastAPI(title="Instant Case Study API", lifespan=lifespan)

# CORS — allow requests from the Next.js frontend
_allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
