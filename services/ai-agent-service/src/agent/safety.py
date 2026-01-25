import re

INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"system prompt",
    r"delete database",
    r"drop table"
]

def check_safety(prompt: str) -> bool:
    """Returns True if safe, False if unsafe."""
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, prompt, re.IGNORECASE):
            return False
    return True
