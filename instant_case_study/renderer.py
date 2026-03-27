import os
import tempfile
from pathlib import Path

import markdown as md
from jinja2 import Environment, FileSystemLoader
from playwright.sync_api import sync_playwright

from .models import GeneratedContent

TEMPLATES_DIR = Path(__file__).parent / "templates"


def render_all(
    content: GeneratedContent,
    output_dir: str = "./output",
    display_name: str | None = None,
) -> tuple[str, str]:
    """Render both PDFs and return (case_study_path, linkedin_post_path)."""
    os.makedirs(output_dir, exist_ok=True)
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

    name = display_name or "Unknown"

    case_study_path = str(Path(output_dir) / "case_study.pdf")
    linkedin_path = str(Path(output_dir) / "linkedin_post.pdf")

    body_html = md.markdown(
        content.case_study_markdown,
        extensions=["fenced_code", "tables", "nl2br"],
    )

    case_study_html = env.get_template("case_study.html.j2").render(
        repo_name=content.repo_name,
        body_html=body_html,
        display_name=name,
    )

    post_text = content.linkedin_post_text
    linkedin_html = env.get_template("linkedin_post.html.j2").render(
        repo_name=content.repo_name,
        post_text=post_text,
        char_count=len(post_text),
        display_name=name,
    )

    with sync_playwright() as p:
        browser = p.chromium.launch()
        _html_to_pdf(browser, case_study_html, case_study_path, is_card=False)
        _html_to_pdf(browser, linkedin_html, linkedin_path, is_card=True)
        browser.close()

    return case_study_path, linkedin_path


def _html_to_pdf(browser, html: str, output_path: str, is_card: bool) -> None:
    """Write HTML to a temp file, load it in a Playwright page, and export PDF."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".html", delete=False, encoding="utf-8"
    ) as f:
        f.write(html)
        tmp_path = f.name

    try:
        page = browser.new_page()
        # file:// URL so relative assets resolve; Tailwind CDN loads over network
        page.goto(f"file:///{tmp_path.replace(os.sep, '/')}", wait_until="networkidle")

        if is_card:
            # Clip to the visible card content — LinkedIn post is a card, not a full page
            page.set_viewport_size({"width": 680, "height": 900})
            page.wait_for_timeout(500)
            page.pdf(
                path=output_path,
                width="680px",
                print_background=True,
            )
        else:
            page.set_viewport_size({"width": 900, "height": 1200})
            page.wait_for_timeout(500)
            page.pdf(
                path=output_path,
                format="A4",
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            )

        page.close()
    finally:
        os.unlink(tmp_path)
