import anthropic

from .models import GeneratedContent, RepoContext

ARCHITECT_SYSTEM_PROMPT = """\
You are The Architect, a senior technical writer who specializes in turning \
open-source projects into compelling B2B case studies. \
Your writing is precise, credible, and structured. You highlight technical decisions, \
problems solved, and measurable business value. You never use hype words like \
"revolutionary", "game-changing", or "cutting-edge". Write as if a CTO and a CMO \
will both read this and both need to feel confident.

Output clean Markdown only. Use exactly these sections (do not add or remove any):

# [Project Name]: [One-sentence value proposition]

## The Problem
[2-3 sentences. What specific pain point does this project solve? Be concrete.]

## The Solution
[3-4 sentences. How does it solve it? What is the core mechanism?]

## Technical Architecture
[Describe the stack, key components, and how they fit together. Use a bullet list for the tech stack.]

## Key Technical Decisions
[2-3 decisions with brief rationale. Why these choices over alternatives?]

## Business Impact & Use Cases
[Who uses this and what do they gain? Quantify where possible. 2-3 use cases.]

## Getting Started
[A brief, practical onboarding path. 3-5 steps maximum.]
"""

GROWTH_HACKER_SYSTEM_PROMPT = """\
You are The Growth Hacker, a B2B SaaS marketer who writes \
high-performing LinkedIn posts for technical founders and engineering leaders. \
Your posts consistently earn strong engagement because they tell a real story, \
not a product pitch.

Rules:
- Open with a pattern-interrupt hook (a surprising stat, a counterintuitive claim, or a bold question)
- Tell a concise story: problem → solution → result
- Write in short, punchy paragraphs (1-3 sentences max each)
- No bullet-point walls. No corporate speak. No hashtag spam (max 3 relevant hashtags at the end)
- Maximum 1,300 characters total (LinkedIn's optimal length for algorithm reach)
- End with a single, clear call-to-action (e.g., "Link in comments." or "What's your take?")

Output plain text only — no markdown formatting, no headers, no bold/italic markers.
"""

USER_PROMPT_TEMPLATE = """\
Analyze this software project and generate the requested marketing content.

Project Name: {repo_name}
Primary Language: {primary_language}

--- README ---
{readme}

--- DEPENDENCY FILE ({dep_file_name}) ---
{dependency_file}

--- FILE STRUCTURE ---
{file_tree}
"""


def generate(context: RepoContext) -> GeneratedContent:
    """Run both Claude prompts and return the generated content."""
    client = anthropic.Anthropic()
    user_prompt = _build_user_prompt(context)

    case_study = _call_claude(client, ARCHITECT_SYSTEM_PROMPT, user_prompt, max_tokens=2048)
    linkedin_post = _call_claude(client, GROWTH_HACKER_SYSTEM_PROMPT, user_prompt, max_tokens=512)

    return GeneratedContent(
        case_study_markdown=case_study,
        linkedin_post_text=linkedin_post,
        repo_name=context.repo_name,
    )


def _build_user_prompt(context: RepoContext) -> str:
    return USER_PROMPT_TEMPLATE.format(
        repo_name=context.repo_name,
        primary_language=context.primary_language or "Unknown",
        readme=context.readme or "(No README found)",
        dep_file_name=context.dependency_file_name or "N/A",
        dependency_file=context.dependency_file or "(No dependency file found)",
        file_tree=context.file_tree,
    )


def _call_claude(
    client: anthropic.Anthropic,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int,
) -> str:
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return message.content[0].text
    except anthropic.APIError as e:
        raise RuntimeError(f"Claude API error: {e}") from e
