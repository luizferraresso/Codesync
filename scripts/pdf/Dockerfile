FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt /tmp/pdf-requirements.txt
RUN pip install --no-cache-dir -r /tmp/pdf-requirements.txt
WORKDIR /repo
CMD ["python", "scripts/build-delivery.py"]
