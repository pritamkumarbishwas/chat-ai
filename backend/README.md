# Chat AI backend

This is the FastAPI service for Chat AI. For the full project overview, architecture diagram, screenshot, provider configuration, and frontend setup, see the [project README](../README.md).

## Local development

From this directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Create a `.env` file in this directory. The mock provider runs without credentials:

```env
LLM_PROVIDER=mock
```

For OpenAI or Groq, set `LLM_PROVIDER` to `openai` or `groq` and provide the matching `OPENAI_API_KEY` or `GROQ_API_KEY`. MongoDB conversation persistence is optional; configure `MONGO_URI` to enable it.

Start the API from this directory:

```powershell
uvicorn app.main:app --reload --port 8000
```

- API: `http://localhost:8000`
- Interactive API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/chat` | Get an assistant response |
| `POST` | `/api/chat/stream` | Stream an assistant response over SSE |
| `GET` | `/api/conversations` | List saved conversations |
| `GET` | `/api/conversations/{conversation_id}` | Get conversation messages |
| `DELETE` | `/api/conversations/{conversation_id}` | Delete a conversation |
| `GET` | `/health` | Health and provider configuration |
