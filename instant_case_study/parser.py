import os
import shutil
import tempfile
from collections import Counter
from pathlib import Path
from typing import Optional

import git

from .models import RepoContext

# Files to search for, in priority order
DEPENDENCY_FILES = [
    "requirements.txt",
    "pyproject.toml",
    "package.json",
    "Cargo.toml",
    "go.mod",
    "Gemfile",
    "pom.xml",
    "build.gradle",
]

README_NAMES = ["README.md", "README.rst", "README.txt", "README"]

# Directories to skip when building the file tree
SKIP_DIRS = {
    ".git", ".github", "__pycache__", "node_modules", ".venv", "venv",
    ".env", "dist", "build", ".next", ".nuxt", "target", ".mypy_cache",
    ".pytest_cache", ".ruff_cache", "coverage",
}

# Extension → language mapping
EXT_TO_LANG = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".rs": "Rust",
    ".go": "Go",
    ".java": "Java",
    ".rb": "Ruby",
    ".cs": "C#",
    ".cpp": "C++",
    ".c": "C",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".php": "PHP",
    ".ex": "Elixir",
    ".exs": "Elixir",
}

README_MAX_CHARS = 8_000
DEPENDENCY_MAX_CHARS = 3_000


def ingest(source: str) -> RepoContext:
    """Accept a GitHub URL or local path and return a RepoContext."""
    if source.startswith("https://") or source.startswith("git@"):
        return _ingest_remote(source)
    else:
        return _ingest_local(source)


def _ingest_remote(url: str) -> RepoContext:
    tmp_dir = tempfile.mkdtemp(prefix="instant-case-study-")
    try:
        repo_name = _repo_name_from_url(url)
        try:
            git.Repo.clone_from(url, tmp_dir, depth=1)
        except git.exc.GitCommandError as e:
            raise RuntimeError(f"Failed to clone repository: {e}") from e

        context = _build_context(source=url, repo_name=repo_name, root=tmp_dir)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    return context


def _ingest_local(path: str) -> RepoContext:
    root = str(Path(path).resolve())
    if not os.path.isdir(root):
        raise RuntimeError(f"Path does not exist or is not a directory: {root}")

    repo_name = Path(root).name
    return _build_context(source=path, repo_name=repo_name, root=root)


def _build_context(source: str, repo_name: str, root: str) -> RepoContext:
    readme = _find_readme(root)
    dep_file_name, dep_content = _find_dependency_file(root)
    file_tree = _build_file_tree(root)
    language = _detect_language(root)

    return RepoContext(
        source=source,
        repo_name=repo_name,
        readme=readme,
        dependency_file=dep_content,
        dependency_file_name=dep_file_name,
        file_tree=file_tree,
        primary_language=language,
    )


def _repo_name_from_url(url: str) -> str:
    # Works for https://github.com/user/repo and https://github.com/user/repo.git
    name = url.rstrip("/").split("/")[-1]
    if name.endswith(".git"):
        name = name[:-4]
    return name


def _find_readme(root: str) -> Optional[str]:
    root_path = Path(root)
    # Case-insensitive search
    existing = {f.name.lower(): f for f in root_path.iterdir() if f.is_file()}
    for name in README_NAMES:
        match = existing.get(name.lower())
        if match:
            try:
                content = match.read_text(encoding="utf-8", errors="replace")
                return content[:README_MAX_CHARS]
            except OSError:
                continue
    return None


def _find_dependency_file(root: str) -> tuple[Optional[str], Optional[str]]:
    root_path = Path(root)
    for name in DEPENDENCY_FILES:
        candidate = root_path / name
        if candidate.is_file():
            try:
                content = candidate.read_text(encoding="utf-8", errors="replace")
                return name, content[:DEPENDENCY_MAX_CHARS]
            except OSError:
                continue
    return None, None


def _build_file_tree(root: str, max_depth: int = 3, max_lines: int = 80) -> str:
    lines: list[str] = []
    root_path = Path(root)
    lines.append(root_path.name + "/")

    def _walk(directory: Path, prefix: str, depth: int) -> None:
        if depth > max_depth or len(lines) >= max_lines:
            return
        try:
            entries = sorted(directory.iterdir(), key=lambda e: (e.is_file(), e.name.lower()))
        except PermissionError:
            return

        dirs = [e for e in entries if e.is_dir() and e.name not in SKIP_DIRS]
        files = [e for e in entries if e.is_file()]

        for i, entry in enumerate(dirs + files):
            if len(lines) >= max_lines:
                lines.append(f"{prefix}  ... (truncated)")
                return
            is_last = (i == len(dirs) + len(files) - 1)
            connector = "└── " if is_last else "├── "
            suffix = "/" if entry.is_dir() else ""
            lines.append(f"{prefix}{connector}{entry.name}{suffix}")
            if entry.is_dir():
                extension = "    " if is_last else "│   "
                _walk(entry, prefix + extension, depth + 1)

    _walk(root_path, "", 1)
    return "\n".join(lines)


def _detect_language(root: str) -> Optional[str]:
    counter: Counter = Counter()
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for filename in filenames:
            ext = Path(filename).suffix.lower()
            if ext in EXT_TO_LANG:
                counter[ext] += 1
    if not counter:
        return None
    top_ext = counter.most_common(1)[0][0]
    return EXT_TO_LANG[top_ext]
