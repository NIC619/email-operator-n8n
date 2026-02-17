#!/usr/bin/env python3
"""
Generate the n8n AI Assign node JSON expression from the system prompt file.

Usage:
    python scripts/generate_expression.py

This reads config/ai_system_prompt.txt and outputs the full n8n expression
that you can paste into the AI Assign HTTP Request node's JSON body field
(set to Expression mode).
"""

import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
PROMPT_FILE = os.path.join(PROJECT_DIR, "config", "ai_system_prompt.txt")
OUTPUT_FILE = os.path.join(PROJECT_DIR, "config", "ai_assign_expression_generated.txt")


def main():
    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        system_prompt = f.read().strip()

    # Escape for JSON embedding
    escaped_prompt = json.dumps(system_prompt)[1:-1]  # Remove outer quotes

    user_content_expr = (
        '"投稿主題：" + $json.subject + '
        '"\\n\\n寄件人：" + $json.senderName + " (" + $json.senderEmail + ")" + '
        '"\\n\\n信件內容：" + $json.emailBody + '
        '"\\n\\n文章內容（如有）：" + $json.articleContent + '
        '"\\n\\n## 近期分配紀錄\\n" + $json.historyText + '
        '"\\n\\n## 近期 Reviewer 工作量統計\\n" + $json.workloadSummary + '
        '"\\n\\n請根據以上資訊，選出最適合且近期工作量較低的 2 位 Reviewer。"'
    )

    expression = f"""{{{{ JSON.stringify({{
  "model": "gpt-4o",
  "temperature": 0.3,
  "messages": [
    {{
      "role": "system",
      "content": "{escaped_prompt}"
    }},
    {{
      "role": "user",
      "content": {user_content_expr}
    }}
  ]
}}) }}}}"""

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(expression)

    print(f"✅ Expression generated and saved to: {OUTPUT_FILE}")
    print(f"\nCopy the contents of that file into the AI Assign node's JSON body field (Expression mode).")
    print(f"\nFile size: {len(expression)} characters")


if __name__ == "__main__":
    main()
