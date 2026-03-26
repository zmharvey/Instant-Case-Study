import os
import sys
from pathlib import Path

import typer
from dotenv import load_dotenv
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

# Resolve .env relative to the project root (parent of this package directory)
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

from . import generator, parser, renderer  # noqa: E402 — after load_dotenv

app = typer.Typer(
    help="Generate a case study and LinkedIn post PDF from a GitHub repo or local path.",
    add_completion=False,
)
console = Console()


@app.command()
def run(
    source: str = typer.Argument(..., help="GitHub repo URL or local directory path"),
    output_dir: str = typer.Option(
        "./output", "--output", "-o", help="Directory to write the output PDFs"
    ),
) -> None:
    _check_api_key()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True,
    ) as progress:
        task = progress.add_task("Ingesting repository...", total=None)

        try:
            context = parser.ingest(source)
        except RuntimeError as e:
            console.print(f"[bold red]Error:[/bold red] {e}")
            raise typer.Exit(1)

        progress.update(task, description=f"Generating content for [bold]{context.repo_name}[/bold]...")

        try:
            content = generator.generate(context)
        except RuntimeError as e:
            console.print(f"[bold red]Error:[/bold red] {e}")
            raise typer.Exit(1)

        progress.update(task, description="Rendering PDFs...")

        try:
            cs_path, li_path = renderer.render_all(content, output_dir)
        except Exception as e:
            console.print(f"[bold red]Render error:[/bold red] {e}")
            raise typer.Exit(1)

    console.print(f"\n[bold green]Done![/bold green] Generated 2 PDFs for [bold]{context.repo_name}[/bold]:\n")
    console.print(f"  [cyan]Case study:[/cyan]    {cs_path}")
    console.print(f"  [cyan]LinkedIn post:[/cyan] {li_path}\n")


def _check_api_key() -> None:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        console.print(
            "[bold red]Error:[/bold red] ANTHROPIC_API_KEY is not set.\n"
            "  Copy [dim].env.example[/dim] to [dim].env[/dim] and add your key, or set it as an environment variable."
        )
        sys.exit(1)


if __name__ == "__main__":
    app()
