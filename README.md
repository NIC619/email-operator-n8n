# TEM Medium 專欄 Reviewer 自動分配系統

Automated reviewer assignment system for Ethereum Meetup Taipei's Medium column submissions, built with n8n.

## Overview

When a community member submits an article to the TEM Medium column via email, this system:

1. **Detects** the submission email via Gmail label filter
2. **Extracts** article information (title, link, sender)
3. **Attempts** to fetch article content for better analysis
4. **Checks** for duplicate submissions
5. **Reads** recent assignment history from Google Sheets
6. **Uses AI** (GPT-4o) to analyze the article topic and select 2 appropriate reviewers
7. **Notifies** the reviewers group via Telegram
8. **Logs** the assignment in Google Sheets for history tracking

## Architecture

```
Gmail (eth.taipei@gmail.com)
  │ Label: TEM-submissions
  │ Subject filter: "TEM 專欄投稿：*"
  ▼
┌─────────────────────────────────┐
│         n8n Workflow             │
│                                 │
│  Gmail Trigger                  │
│    → Extract Info               │
│      → Check Duplicate          │
│        → Fetch Article          │
│          → Read History (Sheets)│
│            → Format History     │
│              → AI Assign (GPT)  │
│                → Parse Response │
│                  ├→ Telegram    │
│                  └→ Log (Sheets)│
│                                 │
│  Error Workflow                  │
│    → Error Trigger              │
│      → Telegram (error alert)   │
└─────────────────────────────────┘
  │                    │
  ▼                    ▼
Google Sheets       Telegram
(Reviewer Log)    (Reviewers Group)
```

## Project Structure

```
tem-reviewer-bot/
├── README.md                  # This file
├── config/
│   ├── reviewer_config.md     # Reviewer list with categories (source of truth)
│   ├── ai_system_prompt.txt   # AI system prompt (edit this to change AI behavior)
│   └── ai_assign_expression.md # n8n expression for AI Assign node (reference)
├── scripts/
│   └── generate_expression.py # Generates n8n expression from system prompt
├── n8n/
│   ├── extract_info.js        # Code node: parse Gmail data
│   ├── format_history.js      # Code node: format Sheets history for AI
│   ├── parse_ai_response.js   # Code node: parse AI JSON response
│   ├── check_duplicate.js     # Code node: deduplication logic
│   ├── telegram_message_template.html   # Telegram notification template
│   └── error_notification_template.html # Error alert template
└── docs/
    ├── setup_guide.md         # Step-by-step setup instructions
    ├── maintenance_guide.md   # How to update reviewers, troubleshoot, etc.
    └── n8n_cloud_migration.md # Guide for migrating to n8n Cloud
```

## Quick Start

See [docs/setup_guide.md](docs/setup_guide.md) for full setup instructions.

## Updating Reviewers

1. Edit `config/reviewer_config.md` with the new reviewer list
2. Edit `config/ai_system_prompt.txt` to match
3. Run `python scripts/generate_expression.py`
4. Copy the generated expression from `config/ai_assign_expression_generated.txt`
5. Paste into the n8n AI Assign node's JSON body field (Expression mode)

See [docs/maintenance_guide.md](docs/maintenance_guide.md) for details.

## Dependencies

- **n8n** (self-hosted or cloud)
- **Gmail API** (OAuth2)
- **Google Sheets API**
- **OpenAI API** (GPT-4o)
- **Telegram Bot API**

## License

Internal tool for Ethereum Meetup Taipei.
