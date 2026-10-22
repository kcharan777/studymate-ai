"""
Unified Multi-Provider AI Service for StudyMate AI.
Supports:
1. Google Gemini (direct official API via GEMINI_API_KEY)
2. OpenRouter (OPENROUTER_API_KEY)
3. Groq (GROQ_API_KEY)
4. OpenAI (OPENAI_API_KEY)
Falls back smoothly if no key is configured or on failure.
"""

import os
import re
import json
import logging
import requests
from pathlib import Path

logger = logging.getLogger("studymate.ai")

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"


def detect_provider(api_key: str, requested_provider: str = None) -> str:
    """Detect AI provider from key format or explicit request."""
    if requested_provider:
        p = requested_provider.lower().strip()
        if p in ["gemini", "google"]:
            return "gemini"
        if p in ["openrouter", "router"]:
            return "openrouter"
        if p in ["groq"]:
            return "groq"
        if p in ["openai"]:
            return "openai"

    if not api_key:
        return ""

    api_key = api_key.strip()
    if api_key.startswith("AIzaSy"):
        return "gemini"
    if api_key.startswith("sk-or-v1-"):
        return "openrouter"
    if api_key.startswith("gsk_"):
        return "groq"
    if api_key.startswith("sk-") and len(api_key) > 40:
        return "openai"

    return "openrouter"


def get_available_provider_and_key(client_key: str = None, client_provider: str = None):
    """Resolve the active AI key and provider based on client headers or environment."""
    if client_key and client_key.strip():
        k = client_key.strip()
        p = detect_provider(k, client_provider)
        return p, k

    # Check environment variables
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        return "gemini", gemini_key

    openrouter_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if openrouter_key:
        return "openrouter", openrouter_key

    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_key:
        return "groq", groq_key

    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    if openai_key:
        return "openai", openai_key

    return None, None


def call_gemini(api_key: str, system_prompt: str, user_prompt: str, json_mode: bool = False, max_tokens: int = 4000, temperature: float = 0.2):
    """Call Google Gemini REST API directly."""
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    combined_prompt = user_prompt
    if system_prompt:
        combined_prompt = f"System Instruction:\n{system_prompt}\n\nUser Request:\n{user_prompt}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": combined_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
    }

    if json_mode:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    try:
        res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=90)
        if res.status_code != 200:
            logger.error(f"Gemini error {res.status_code}: {res.text}")
            return None, f"Gemini error {res.status_code}: {res.text}"

        data = res.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None, "No candidates returned by Gemini"

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return None, "Empty text in Gemini response"

        text = parts[0].get("text", "")
        return text, None
    except Exception as e:
        logger.error(f"Gemini call exception: {e}")
        return None, str(e)


def call_openai_compatible(endpoint: str, api_key: str, model: str, system_prompt: str, user_prompt: str, json_mode: bool = False, max_tokens: int = 4000, temperature: float = 0.3):
    """Call standard OpenAI-compatible completions API (OpenRouter, Groq, OpenAI)."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "StudyMate AI",
    }

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        res = requests.post(endpoint, headers=headers, json=payload, timeout=90)
        if res.status_code != 200:
            logger.error(f"API error {res.status_code}: {res.text}")
            return None, f"API error {res.status_code}: {res.text}"

        data = res.json()
        choices = data.get("choices", [])
        if not choices:
            return None, "No choices returned by AI provider"

        content = choices[0].get("message", {}).get("content", "")
        return content, None
    except Exception as e:
        logger.error(f"API call exception: {e}")
        return None, str(e)


def call_llm(user_prompt: str, system_prompt: str = None, json_mode: bool = False, max_tokens: int = 4000, temperature: float = 0.3, client_key: str = None, client_provider: str = None):
    """Route LLM call to active provider."""
    provider, api_key = get_available_provider_and_key(client_key, client_provider)
    if not provider or not api_key:
        return None, "NO_API_KEY"

    logger.info(f"Routing request to provider: {provider}")

    if provider == "gemini":
        return call_gemini(api_key, system_prompt, user_prompt, json_mode, max_tokens, temperature)

    if provider == "openrouter":
        model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")
        return call_openai_compatible(OPENROUTER_ENDPOINT, api_key, model, system_prompt, user_prompt, json_mode, max_tokens, temperature)

    if provider == "groq":
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        return call_openai_compatible(GROQ_ENDPOINT, api_key, model, system_prompt, user_prompt, json_mode, max_tokens, temperature)

    if provider == "openai":
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return call_openai_compatible(OPENAI_ENDPOINT, api_key, model, system_prompt, user_prompt, json_mode, max_tokens, temperature)

    return None, f"Unsupported provider: {provider}"


def sanitize_json_response(raw_text: str) -> dict:
    """Robustly parse JSON even if surrounded by markdown code fences."""
    if not raw_text:
        return None

    cleaned = raw_text.strip()
    # Strip markdown fences ```json ... ```
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        # Try finding the first '{' and last '}'
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(cleaned[start:end+1])
            except Exception as e:
                logger.warning(f"Secondary JSON parsing failed: {e}")
                return None
        return None


def test_ai_key(api_key: str, requested_provider: str = None) -> dict:
    """Quick validation check for an API key."""
    provider = detect_provider(api_key, requested_provider)
    test_prompt = "Reply with exactly: {\"status\": \"ok\", \"message\": \"connected\"}"
    system = "You are a connectivity test agent. Return valid JSON."

    if provider == "gemini":
        res, err = call_gemini(api_key, system, test_prompt, json_mode=True, max_tokens=100)
    elif provider == "openrouter":
        res, err = call_openai_compatible(OPENROUTER_ENDPOINT, api_key, "google/gemini-2.5-flash", system, test_prompt, json_mode=True, max_tokens=100)
    elif provider == "groq":
        res, err = call_openai_compatible(GROQ_ENDPOINT, api_key, "llama-3.3-70b-versatile", system, test_prompt, json_mode=True, max_tokens=100)
    elif provider == "openai":
        res, err = call_openai_compatible(OPENAI_ENDPOINT, api_key, "gpt-4o-mini", system, test_prompt, json_mode=True, max_tokens=100)
    else:
        return {"success": False, "error": f"Unknown provider for key"}

    if err:
        return {"success": False, "error": err, "provider": provider}

    parsed = sanitize_json_response(res)
    return {"success": True, "provider": provider, "response": parsed or res}
