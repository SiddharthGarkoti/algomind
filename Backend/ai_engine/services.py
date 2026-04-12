from django.conf import settings
from .prompts import get_system_prompt, PLACEHOLDER_RESPONSES


# ── Gemini ────────────────────────────────────────────────────────────────────

def _call_gemini(request_type: str, user_input: str, problem=None) -> str:
    system = get_system_prompt(request_type, problem)
    # Try new google-genai SDK
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        resp = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=f"{system}\n\nUser: {user_input}",
        )
        return resp.text
    except ImportError:
        pass  # SDK not installed, try legacy package below
    # Try legacy google-generativeai package
    import google.generativeai as genai_legacy
    genai_legacy.configure(api_key=settings.GEMINI_API_KEY)
    model = genai_legacy.GenerativeModel('gemini-pro')
    resp = model.generate_content(f"{system}\n\nUser: {user_input}")
    return resp.text


# ── Groq ──────────────────────────────────────────────────────────────────────

def _call_groq(request_type: str, user_input: str, problem=None) -> str:
    from groq import Groq
    client   = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        model='llama-3.1-8b-instant',
        messages=[
            {'role': 'system', 'content': get_system_prompt(request_type, problem)},
            {'role': 'user',   'content': user_input},
        ],
        max_tokens=800,
        temperature=0.7,
    )
    return response.choices[0].message.content


# ── OpenAI (fallback) ─────────────────────────────────────────────────────────

def _call_openai(request_type: str, user_input: str, problem=None) -> str:
    from openai import OpenAI
    client   = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=[
            {'role': 'system', 'content': get_system_prompt(request_type, problem)},
            {'role': 'user',   'content': user_input},
        ],
        max_tokens=800,
        temperature=0.7,
    )
    return response.choices[0].message.content


# ── Plus / Pro tier AI (placeholder slot) ─────────────────────────────────────
# When a "Plus" or "Pro" plan AI agent is integrated, point it here.
# The view will call call_ai_pro() for users with plan='plus' or plan='pro'.

def _call_pro_ai(request_type: str, user_input: str, problem=None) -> str:
    """
    Placeholder for the Pro-plan AI agent.
    Currently falls back to the same pipeline as the standard plan.
    Replace this body with a more powerful model (e.g. Gemini 1.5 Pro, GPT-4o)
    once the Plus/Pro subscription is live.
    """
    return call_ai(request_type, user_input, problem)


# ── Dispatcher ────────────────────────────────────────────────────────────────

def call_ai(request_type: str, user_input: str, problem=None) -> str:
    """
    Priority: Gemini (free) → Groq (free) → OpenAI (paid) → placeholder.
    Each provider falls through on ANY exception (quota, network, import, etc).
    """
    last_err = None

    if getattr(settings, 'GEMINI_API_KEY', ''):
        try:
            return _call_gemini(request_type, user_input, problem)
        except Exception as exc:
            last_err = exc  # quota / network / import — fall through

    if getattr(settings, 'GROQ_API_KEY', ''):
        try:
            return _call_groq(request_type, user_input, problem)
        except Exception as exc:
            last_err = exc  # fall through to OpenAI

    if getattr(settings, 'OPENAI_API_KEY', ''):
        try:
            return _call_openai(request_type, user_input, problem)
        except Exception as exc:
            raise RuntimeError(f"OpenAI error: {exc}") from exc

    return PLACEHOLDER_RESPONSES.get(
        request_type,
        "AI mentor is not configured yet. Add GEMINI_API_KEY or GROQ_API_KEY to Backend/.env to enable it.",
    )


def call_ai_pro(request_type: str, user_input: str, problem=None) -> str:
    """Called for Plus/Pro plan users — currently same pipeline, ready for upgrade."""
    return _call_pro_ai(request_type, user_input, problem)


# ── Plan Generation ───────────────────────────────────────────────────────────

def generate_plan(weak_areas: list, intensity: str, user_stats: dict) -> dict:
    """
    Generate a personalised study plan using AI based on the user's weak areas.
    weak_areas  – list of {topic_name, problems_solved, status}
    intensity   – 'Light' | 'Balanced' | 'Intense'
    user_stats  – {total_solved, easy_solved, medium_solved, hard_solved, rating}
    Returns a dict with 'topics', 'daily_goal', 'theory_focus', 'message'.
    """
    weak_names = ', '.join(t['topic_name'] for t in weak_areas[:5]) if weak_areas else 'General DSA'

    prompt = f"""
You are an expert DSA coach. Generate a personalised study plan.

User profile:
- Problems solved: {user_stats.get('total_solved', 0)} (Easy: {user_stats.get('easy_solved', 0)}, Medium: {user_stats.get('medium_solved', 0)}, Hard: {user_stats.get('hard_solved', 0)})
- Rating: {user_stats.get('rating', 0)}
- Weak areas (prioritise these): {weak_names}
- Study intensity: {intensity}

Return a JSON object (no markdown, raw JSON only) with these keys:
{{
  "daily_goal": <number of problems per day>,
  "theory_focus": "<one concise sentence on what theory to study this week>",
  "topics": [
    {{"name": "<topic>", "priority": "high|medium|low", "reason": "<one short sentence>", "suggested_count": <number>}}
  ],
  "message": "<one motivating 1-2 sentence coaching message>"
}}
Include 3-6 topics. Prioritise the weak areas but also include 1 strength for reinforcement.
"""

    try:
        raw = call_ai('explain', prompt)
        import json, re
        # Strip markdown code fences if present
        cleaned = re.sub(r'^```[a-z]*\n?|```$', '', raw.strip(), flags=re.MULTILINE).strip()
        return json.loads(cleaned)
    except Exception:
        # Fallback structured plan if AI fails or returns non-JSON
        topics = [{'name': t['topic_name'], 'priority': 'high', 'reason': 'Identified as weak area.', 'suggested_count': 5}
                  for t in weak_areas[:3]]
        if not topics:
            topics = [{'name': 'Arrays', 'priority': 'high', 'reason': 'Foundational topic.', 'suggested_count': 5}]
        return {
            'daily_goal':    3 if intensity == 'Light' else (5 if intensity == 'Balanced' else 8),
            'theory_focus':  f"Review core concepts in {topics[0]['name']}.",
            'topics':        topics,
            'message':       "Stay consistent — even 3 problems a day compounds into mastery.",
        }
