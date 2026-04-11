from django.conf import settings
from .prompts import get_system_prompt, PLACEHOLDER_RESPONSES


def call_ai(request_type: str, user_input: str, problem=None) -> str:
    print("GROQ KEY:", settings.GROQ_API_KEY)

    if not settings.GROQ_API_KEY:
        return PLACEHOLDER_RESPONSES.get(request_type, "AI service not configured.")

    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': get_system_prompt(request_type, problem)},
                {'role': 'user',   'content': user_input},
            ],
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as exc:
        raise RuntimeError(f"Groq error: {exc}") from exc