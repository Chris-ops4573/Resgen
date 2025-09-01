# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps: curl for download, fonts for Unicode, SSL certs
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates fonts-dejavu \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Install Tectonic from official one-line installer (puts binary in current dir) ---
# Ref: https://tectonic-typesetting.github.io/book/latest/installation/  (copy-paste method)
RUN curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh \
 && mv tectonic /usr/local/bin/tectonic \
 && chmod +x /usr/local/bin/tectonic

# (Optional but nice) tell your code exactly where it lives
ENV TECTONIC_BIN=/usr/local/bin/tectonic

# Install Python deps first for better caching
COPY requirements.txt .
RUN python -m pip install --upgrade pip && pip install -r requirements.txt

# Copy the app
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]