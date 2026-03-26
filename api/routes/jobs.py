import asyncio
import re
import uuid
from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from api.db import get_db
from api.routes.auth import require_user
from api import worker as worker_module
from api.db import _pool

router = APIRouter(prefix="/jobs", tags=["jobs"])

GITHUB_URL_RE = re.compile(r"^https://github\.com/[^/]+/[^/]+")


class CreateJobRequest(BaseModel):
    repo_url: str


class JobResponse(BaseModel):
    id: str
    user_id: str
    repo_url: str
    repo_name: str | None
    status: str
    error_msg: str | None
    created_at: str
    finished_at: str | None


def _row_to_response(row: asyncpg.Record) -> JobResponse:
    return JobResponse(
        id=str(row["id"]),
        user_id=row["user_id"],
        repo_url=row["repo_url"],
        repo_name=row["repo_name"],
        status=row["status"],
        error_msg=row["error_msg"],
        created_at=row["created_at"].isoformat(),
        finished_at=row["finished_at"].isoformat() if row["finished_at"] else None,
    )


@router.post("", status_code=status.HTTP_202_ACCEPTED, response_model=JobResponse)
async def create_job(
    body: CreateJobRequest,
    user_id: Annotated[str, Depends(require_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
):
    if not GITHUB_URL_RE.match(body.repo_url):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="repo_url must be a valid GitHub HTTPS URL (https://github.com/owner/repo)",
        )

    job_id = str(uuid.uuid4())
    row = await db.fetchrow(
        """INSERT INTO jobs (id, user_id, repo_url)
           VALUES ($1, $2, $3)
           RETURNING *""",
        job_id,
        user_id,
        body.repo_url,
    )

    # Fire and forget — worker updates the row when done
    asyncio.create_task(worker_module.run_job(job_id, body.repo_url, _pool))

    return _row_to_response(row)


@router.get("", response_model=list[JobResponse])
async def list_jobs(
    user_id: Annotated[str, Depends(require_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    offset: int = 0,
):
    rows = await db.fetch(
        "SELECT * FROM jobs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20 OFFSET $2",
        user_id,
        offset,
    )
    return [_row_to_response(r) for r in rows]


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    user_id: Annotated[str, Depends(require_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
):
    row = await db.fetchrow("SELECT * FROM jobs WHERE id=$1", job_id)
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    if row["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _row_to_response(row)


@router.get("/{job_id}/download/case-study")
async def download_case_study(
    job_id: str,
    user_id: Annotated[str, Depends(require_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
):
    row = await db.fetchrow("SELECT * FROM jobs WHERE id=$1", job_id)
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    if row["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if row["status"] != "done":
        raise HTTPException(status_code=400, detail="Job is not complete")

    repo_name = row["repo_name"] or "case_study"
    return FileResponse(
        path=row["cs_pdf_path"],
        media_type="application/pdf",
        filename=f"case_study_{repo_name}.pdf",
    )


@router.get("/{job_id}/download/linkedin")
async def download_linkedin(
    job_id: str,
    user_id: Annotated[str, Depends(require_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
):
    row = await db.fetchrow("SELECT * FROM jobs WHERE id=$1", job_id)
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    if row["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if row["status"] != "done":
        raise HTTPException(status_code=400, detail="Job is not complete")

    repo_name = row["repo_name"] or "linkedin_post"
    return FileResponse(
        path=row["li_pdf_path"],
        media_type="application/pdf",
        filename=f"linkedin_post_{repo_name}.pdf",
    )
