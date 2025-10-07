FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PINECONE_API_KEY=pcsk_2uLSpb_KTujBoRfZzRKRGKkyzZeP7NeG4rooSQbm9iw1A62mDfPp6KyrusVzxxxm3eFuCK \
    PINECONE_REGION=us-east-1 \
    CORS_ORIGINS=http://localhost:5173
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
