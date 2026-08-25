import logging
from groq import Groq, APIError, RateLimitError, APITimeoutError

from app.schemas.chat import Message

logger = logging.getLogger(__name__)

MOCK_RESPONSES: dict[str, str] = {
    "hello": "Hello! I'm your AI assistant. How can I help you today?",
    "hi": "Hey there! What can I do for you?",
    "hey": "Hi! Ready to help. What do you need?",
    "who are you": "I'm an AI chatbot powered by a language model. I can help with writing, coding, analysis, math, and much more.",
    "what are you": "I'm an AI assistant built with FastAPI and a large language model. Currently running in mock mode, but ready to be connected to OpenAI or Groq.",
    "help": "I can help with:\n\n- **Writing** - essays, emails, stories, scripts\n- **Coding** - debug, explain, write code in any language\n- **Analysis** - data, research, comparisons\n- **Math** - equations, statistics, calculus\n- **Creative** - brainstorming, ideas, content\n\nJust ask me anything!",
    "react": "React is a JavaScript library for building user interfaces, created by Meta. Key concepts:\n\n- **Components** - reusable UI pieces\n- **JSX** - HTML-like syntax in JavaScript\n- **Hooks** - state and lifecycle in function components\n- **Virtual DOM** - efficient rendering\n\n```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;\n}\n```",
    "python": "Python is a versatile, high-level programming language. It's known for:\n\n- **Simple syntax** - readable and clean\n- **Extensive libraries** - data science, web, AI\n- **Dynamic typing** - no type declarations needed\n- **Wide use** - backend, ML, automation, scripts\n\n```python\ndef greet(name: str) -> str:\n    return f\"Hello, {name}!\"\n```",
}

MOCK_TOPIC_KEYWORDS: list[str] = list(MOCK_RESPONSES.keys())
CODE_KEYWORDS: frozenset[str] = frozenset(["code", "program", "function", "debug", "api", "endpoint"])
WRITE_KEYWORDS: frozenset[str] = frozenset(["write", "essay", "email", "letter", "draft", "compose"])

SYSTEM_PROMPT: str = "You are a helpful, harmless, and honest AI assistant."


def _detect_topic(message: str) -> str | None:
    lower = message.lower()
    for keyword in MOCK_TOPIC_KEYWORDS:
        if keyword in lower:
            return keyword
    return None


def generate_mock_response(message: str, history: list[Message]) -> str:
    topic = _detect_topic(message)
    if topic:
        return MOCK_RESPONSES[topic]

    msg_lower = message.lower()

    if CODE_KEYWORDS & set(msg_lower.split()):
        return (
            "Here's how I'd approach that:\n\n```python\n# Your code here\n```\n\n"
            "Let me know if you need help with a specific part!"
        )

    if WRITE_KEYWORDS & set(msg_lower.split()):
        return (
            "I'd be happy to help you write that. Here's a draft:\n\n---\n\n"
            "[Your content will go here]\n\n---\n\n"
            "Would you like me to adjust the tone, length, or style?"
        )

    if history:
        truncated = message[:100] + ("..." if len(message) > 100 else "")
        return (
            f"That's a great follow-up question. Based on our conversation:\n\n"
            f'Your message was: "{truncated}"\n\n'
            "Let me know if you'd like me to elaborate on any point!"
        )

    truncated = message[:80] + ("..." if len(message) > 80 else "")
    return f'That\'s an interesting question! Regarding: "{truncated}"\n\nThere are several aspects worth considering. Feel free to ask follow-up questions!'


def _build_messages(message: str, history: list[Message]) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.role.value, "content": msg.content})
    messages.append({"role": "user", "content": message})
    return messages


class LLMService:
    def __init__(self, provider: str, api_key: str, model: str):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self._groq_client: Groq | None = None

    def _get_groq_client(self) -> Groq:
        if self._groq_client is None:
            self._groq_client = Groq(api_key=self.api_key)
        return self._groq_client

    async def generate(self, message: str, history: list[Message]) -> str:
        if self.provider == "mock":
            return generate_mock_response(message, history)
        if self.provider == "groq":
            return await self._generate_groq(message, history)
        if self.provider == "openai":
            return await self._generate_openai(message, history)
        raise ValueError(f"Unknown LLM provider: {self.provider}")

    async def _generate_groq(self, message: str, history: list[Message]) -> str:
        client = self._get_groq_client()
        messages = _build_messages(message, history)

        try:
            response = client.chat.completions.create(
                model=self.model or "openai/gpt-oss-20b",
                messages=messages,
                max_tokens=2048,
                temperature=0.7,
            )
            return response.choices[0].message.content or ""
        except RateLimitError:
            logger.error("Groq rate limit exceeded")
            raise
        except APITimeoutError:
            logger.error("Groq request timed out")
            raise
        except APIError as e:
            logger.error(f"Groq API error: {e}")
            raise

    async def _generate_openai(self, message: str, history: list[Message]) -> str:
        from openai import AsyncOpenAI, APIError as OpenAIError, RateLimitError as OpenAIRateLimitError, APITimeoutError as OpenAITimeoutError

        client = AsyncOpenAI(api_key=self.api_key)
        messages = _build_messages(message, history)

        try:
            response = await client.chat.completions.create(
                model=self.model or "gpt-4o",
                messages=messages,
                max_tokens=2048,
                temperature=0.7,
            )
            return response.choices[0].message.content or ""
        except OpenAIRateLimitError:
            logger.error("OpenAI rate limit exceeded")
            raise
        except OpenAITimeoutError:
            logger.error("OpenAI request timed out")
            raise
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise

    async def close(self) -> None:
        self._groq_client = None
