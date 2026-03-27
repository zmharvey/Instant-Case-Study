from pydantic import BaseModel
from typing import Optional


class RepoContext(BaseModel):
    source: str
    repo_name: str
    readme: Optional[str] = None
    dependency_file: Optional[str] = None
    dependency_file_name: Optional[str] = None
    file_tree: str
    primary_language: Optional[str] = None


class UserContext(BaseModel):
    company_name: Optional[str] = None
    target_audience: Optional[str] = None
    tone: Optional[str] = None
    positioning_blurb: Optional[str] = None


class GeneratedContent(BaseModel):
    case_study_markdown: str
    linkedin_post_text: str
    repo_name: str
