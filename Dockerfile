# Use Microsoft's official Playwright Python image — includes all Chromium system dependencies
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

WORKDIR /app

# Install the core package (instant_case_study) and its dependencies
COPY pyproject.toml ./
COPY instant_case_study/ ./instant_case_study/
RUN pip install --no-cache-dir -e .

# Install the API dependencies
COPY api/requirements.txt ./api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

# Install Playwright's Chromium browser
RUN playwright install chromium

# Copy the API source
COPY api/ ./api/

# Data volume for generated PDFs
VOLUME ["/data"]

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
