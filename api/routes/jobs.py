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
from api import db as db_module
from api import worker as worker_module

router = APIRouter(prefix="/jobs", tags=["jobs"])

GITHUB_URL_RE = re.compile(r"^https://github\.com/[^/]+/[^/]+")


VALID_TONES = {"Professional", "Conversational", "Technical"}


class CreateJobRequest(BaseModel):
    repo_url: str
    display_name: str | None = None
    company_name: str | None = None
    target_audience: str | None = None
    tone: str | None = None
    positioning_blurb: str | None = None


class JobResponse(BaseModel):
    id: str
    user_id: str
    repo_url: str
    repo_name: str | None
    status: str
    error_msg: str | None
    created_at: str
    finished_at: str | None
    company_name: str | None
    target_audience: str | None
    tone: str | None
    positioning_blurb: str | None


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
        company_name=row["company_name"],
        target_audience=row["target_audience"],
        tone=row["tone"],
        positioning_blurb=row["positioning_blurb"],
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

    if body.tone and body.tone not in VALID_TONES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"tone must be one of: {', '.join(sorted(VALID_TONES))}",
        )

    job_id = str(uuid.uuid4())
    row = await db.fetchrow(
        """INSERT INTO jobs (id, user_id, repo_url, display_name, company_name, target_audience, tone, positioning_blurb)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *""",
        job_id,
        user_id,
        body.repo_url,
        body.display_name,
        body.company_name,
        body.target_audience,
        body.tone,
        body.positioning_blurb,
    )

    # Fire and forget — worker updates the row when done
    asyncio.create_task(worker_module.run_job(job_id, body.repo_url, db_module._pool))

    return _row_to_response(row)


@router.get("", response_model=list[JobResponse])
async def list_jobs(
    user_id: Annotated[str, Depends(require_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    offset: int = 0,
    limit: int = 11,
):
    rows = await db.fetch(
        "SELECT * FROM jobs WHERE user_id=$1 ORDER BY created_at DESC LIMIT $3 OFFSET $2",
        user_id,
        offset,
        limit,
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


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str,
    user_id: Annotated[str, Depends(require_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
):
    row = await db.fetchrow("SELECT user_id FROM jobs WHERE id=$1", job_id)
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    if row["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.execute("DELETE FROM jobs WHERE id=$1", job_id)


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
