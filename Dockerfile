# Use slim Python image instead of the heavy Playwright base (~1.8GB → ~600MB)
FROM python:3.12-slim

WORKDIR /app

# Install the core package (instant_case_study) and its dependencies
COPY pyproject.toml ./
COPY instant_case_study/ ./instant_case_study/
RUN pip install --no-cache-dir -e .

# Install the API dependencies
COPY api/requirements.txt ./api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

# Install Chromium system dependencies then the browser itself
# playwright install-deps handles all required apt packages automatically
RUN playwright install-deps chromium && playwright install chromium

# Copy the API source
COPY api/ ./api/

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
