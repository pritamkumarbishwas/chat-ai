# Chat AI Backend

FastAPI backend for the ChatGPT-style chatbot.

## Setup

```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy env file and configure
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## LLM Providers

| Provider | `LLM_PROVIDER` | Model |
|----------|----------------|-------|
| Mock (default) | `mock` | N/A |
| OpenAI | `openai` | gpt-4o |
| Groq | `groq` | llama3-70b-8192 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Send message, get AI reply |
| `GET` | `/health` | Health check |

### POST /api/chat

```json
{
  "message": "Hello!",
  "history": [],
  "conversation_id": "optional-id"
}
```

Response:

```json
{
  "reply": "Hello! How can I help you?",
  "conversation_id": "uuid"
}
```
