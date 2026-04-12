SYSTEM_BASE = """You are AlgoMind, an expert DSA mentor.
Your job is to GUIDE students — never give full solutions.
Be concise, encouraging, and Socratic."""

HINT_SYSTEM = SYSTEM_BASE + """
Give a single, clear hint that nudges the student forward.
Do NOT reveal the algorithm or write any code."""

EXPLAIN_SYSTEM = SYSTEM_BASE + """
Explain the concept or approach the student is asking about.
Use simple language and an analogy if possible."""

DEBUG_SYSTEM = SYSTEM_BASE + """
Analyse the student's code for bugs.
Point out WHERE the bug is and WHY, but do NOT rewrite their code."""


def get_system_prompt(request_type: str, problem=None) -> str:
    base = {
        'hint':    HINT_SYSTEM,
        'explain': EXPLAIN_SYSTEM,
        'debug':   DEBUG_SYSTEM,
    }.get(request_type, SYSTEM_BASE)

    if problem:
        base += f"\n\nCurrent Problem: {problem.title} ({problem.difficulty})\n{problem.description}"
    return base


PLACEHOLDER_RESPONSES = {
    'hint':    "Think about what data structure would let you look up values in O(1) time. What have you learned that does that?",
    'explain': "This problem is asking you to find an optimal substructure — meaning the solution to the whole problem can be built from solutions to smaller versions of the same problem.",
    'debug':   "Check your loop boundary conditions carefully — off-by-one errors are very common here. Also verify you are handling the edge case where the input is empty.",
}
