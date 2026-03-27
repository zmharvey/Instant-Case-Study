import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from functools import partial

import asyncpg

from instant_case_study import generator, parser, renderer
from instant_case_study.models import UserContext

_executor = ThreadPoolExecutor(max_workers=4)


async def run_job(job_id: str, repo_url: str, pool: asyncpg.Pool) -> None:
    loop = asyncio.get_event_loop()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT display_name, company_name, target_audience, tone, positioning_blurb, case_study_style FROM jobs WHERE id=$1",
            job_id,
        )
        display_name = row["display_name"] if row else None
        user_context = UserContext(
            company_name=row["company_name"],
            target_audience=row["target_audience"],
            tone=row["tone"],
            positioning_blurb=row["positioning_blurb"],
            case_study_style=row["case_study_style"],
        ) if row else None
        await conn.execute("UPDATE jobs SET status='running' WHERE id=$1", job_id)

    try:
        context = await loop.run_in_executor(_executor, parser.ingest, repo_url)
        content = await loop.run_in_executor(
            _executor, partial(generator.generate, context, user_context)
        )

        out_dir = f"/data/jobs/{job_id}"
        cs_path, li_path = await loop.run_in_executor(
            _executor, renderer.render_all, content, out_dir, display_name
        )

        async with pool.acquire() as conn:
            await conn.execute(
                """UPDATE jobs
                   SET status='done', repo_name=$2, cs_pdf_path=$3, li_pdf_path=$4, finished_at=now()
                   WHERE id=$1""",
                job_id,
                content.repo_name,
                cs_path,
                li_path,
            )
    except Exception as e:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE jobs SET status='failed', error_msg=$2 WHERE id=$1",
                job_id,
                str(e),
            )
