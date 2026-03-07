import requests
import json
from plan_context import get_relevant_plan_context

import os

OLLAMA_URL = os.getenv("OLLAMA_URL")

SYSTEM_PROMPT = """
You are an AI decision engine for Kozhikode Municipal Corporation.

Inputs:
- Complaint description
- Text classification result
- Image classification result
- Sentiment-based urgency score
- Master Plan context

Tasks:
1. Detect mismatch between image and text category
2. Assign priority (High / Medium / Low)
3. Check alignment with Master Plan
4. Recommend a municipal action

Important Rule:
- If a mismatch is detected, recommend verification before physical action.

Output ONLY valid JSON.
Output ONLY valid JSON.
ALL fields must be filled.

JSON FORMAT:
{
  "issue_type": "",
  "priority": "",
  "alignment_with_master_plan": "",
  "mismatch_detected": true/false,
  "recommended_action": "",
  "reasoning": ""
}
"""


def run_llm(prompt):
    payload = {
        "model": "llama3",
        "prompt": prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "options": {
            "temperature": 0.2
        }
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=120)
    response.raise_for_status()

    output = response.json()["response"]

    try:
        json_start = output.index("{")
        json_end = output.rindex("}") + 1
        return json.loads(output[json_start:json_end])
    except Exception:
        return {
            "error": "Invalid JSON from LLM",
            "raw_output": output
        }


def make_decision(data):
    def normalize_label(label):
        return label.lower().replace("_", " ").strip()

    mismatch = normalize_label(data["text_label"]) != normalize_label(data["image_label"])


    plan_context = get_relevant_plan_context(data["text_label"])
    final_issue = data["text_label"] if not mismatch else "verification_required"

    # Explicit guidance to avoid contradictory actions
    if mismatch:
        verification_note = (
            "Mismatch detected. Recommend field verification before executing any repair or cleanup."
        )
    else:
        verification_note = (
            "No mismatch detected. Action can proceed directly based on complaint."
        )

    user_prompt = f"""
Complaint Description:
{data['description']}

Text Category:
{data['text_label']}

Image Category:
{data['image_label']}

Final Issue Type:
{final_issue}

Mismatch Detected:
{mismatch}

Verification Instruction:
{verification_note}

Sentiment:
{data['sentiment']}

Urgency Score (0 to 1):
{data['severity_score']}

Upvotes:
{data['upvotes']}

Location:
{data['location']}

Relevant Master Plan Context:
{plan_context}
"""

    return run_llm(user_prompt)
