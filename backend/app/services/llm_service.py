import random
import uuid
from app.schemas.chat import Message, MessageRole


MOCK_RESPONSES = {
    "hello": "Hello! I'm your AI assistant. How can I help you today?",
    "hi": "Hey there! What can I do for you?",
    "hey": "Hi! Ready to help. What do you need?",
    "who are you": "I'm an AI chatbot powered by a language model. I can help with writing, coding, analysis, math, and much more.",
    "what are you": "I'm an AI assistant built with FastAPI and a large language model. Currently running in mock mode, but ready to be connected to OpenAI or Groq.",
    "help": "I can help with:\n\n- **Writing** - essays, emails, stories, scripts\n- **Coding** - debug, explain, write code in any language\n- **Analysis** - data, research, comparisons\n- **Math** - equations, statistics, calculus\n- **Creative** - brainstorming, ideas, content\n\nJust ask me anything!",
    "react": "React is a JavaScript library for building user interfaces, created by Meta. Key concepts:\n\n- **Components** - reusable UI pieces\n- **JSX** - HTML-like syntax in JavaScript\n- **Hooks** - state and lifecycle in function components\n- **Virtual DOM** - efficient rendering\n\n```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;\n}\n```",
    "python": "Python is a versatile, high-level programming language. It's known for:\n\n- **Simple syntax** - readable and clean\n- **Extensive libraries** - data science, web, AI\n- **Dynamic typing** - no type declarations needed\n- **Wide use** - backend, ML, automation, scripts\n\n```python\ndef greet(name: str) -> str:\n    return f\"Hello, {name}!\"\n```",
    "default": "That's an interesting question! Let me think about this.\n\n{input_context}\n\nThere are several aspects worth considering here. The key factors depend on your specific use case and requirements.\n\nFeel free to ask follow-up questions for more details!",
}


def _detect_topic(message: str) -> str | None:
    lower = message.lower()
    for keyword in ["hello", "hi", "hey", "who are you", "what are you", "help", "react", "python"]:
        if keyword in lower:
            return keyword
    return None


def generate_mock_response(message: str, history: list[Message]) -> str:
    topic = _detect_topic(message)

    if topic and topic in MOCK_RESPONSES:
        return MOCK_RESPONSES[topic]

    if any(w in message.lower() for w in ["code", "program", "function", "debug"]):
        return f"Here's how I'd approach that:\n\n```python\n# Your code here\n```\n\nLet me know if you need help with a specific part!"

    if any(w in message.lower() for w in ["write", "essay", "email", "letter"]):
        return "I'd be happy to help you write that. Here's a draft:\n\n---\n\n[Your content will go here]\n\n---\n\nWould you like me to adjust the tone, length, or style?"

    if len(history) > 0:
        return f"That's a great follow-up question. Based on our conversation, here's my response:\n\nYour message was: \"{message[:100]}{'...' if len(message) > 100 else ''}\"\n\nLet me know if you'd like me to elaborate on any point!"

    return MOCK_RESPONSES["default"].replace("{input_context}", f"Regarding: \"{message[:80]}{'...' if len(message) > 80 else ''}\"")


class LLMService:
    def __init__(self, provider: str = "mock", api_key: str = "", model: str = ""):
        self.provider = provider
        self.api_key = api_key
        self.model = model

    async def generate(self, message: str, history: list[Message]) -> str:
        if self.provider == "mock":
            return generate_mock_response(message, history)

        if self.provider == "openai":
            return await self._generate_openai(message, history)

        if self.provider == "groq":
            return await self._generate_groq(message, history)

        raise ValueError(f"Unknown LLM provider: {self.provider}")

    async def _generate_openai(self, message: str, history: list[Message]) -> str:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=self.api_key)

        messages = [{"role": "system", "content": "You are a helpful AI assistant."}]
        for msg in history:
            messages.append({"role": msg.role.value, "content": msg.content})
        messages.append({"role": "user", "content": message})

        response = await client.chat.completions.create(
            model=self.model or "gpt-4o",
            messages=messages,
            max_tokens=2048,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""

    async def _generate_groq(self, message: str, history: list[Message]) -> str:
        import httpx

        messages = [{"role": "system", "content": "You are a helpful AI assistant."}]
        for msg in history:
            messages.append({"role": msg.role.value, "content": msg.content})
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model or "llama3-70b-8192",
                    "messages": messages,
                    "max_tokens": 2048,
                    "temperature": 0.7,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
