# TEM Medium 專欄 Reviewer 自動分配系統

Automated reviewer assignment system for Ethereum Meetup Taipei's Medium column submissions, built with n8n.

## Overview

When a community member submits an article to the TEM Medium column via email, this system:

1. **Detects** the submission email via Gmail label filter
2. **Extracts** article information (title, link, sender)
3. **Deduplicates** — skips emails that have already been processed
4. **Attempts** to fetch article content for better analysis
5. **Reads** recent assignment history from Google Sheets
6. **Uses AI** (GPT-4o) to analyze the article topic and select 2 appropriate reviewers, balancing workload
7. **Notifies** the reviewers group via Telegram with @mentions
8. **Logs** the assignment in Google Sheets for history tracking and deduplication
9. **Alerts** on errors via a separate Telegram notification to admin

## Architecture

```
Gmail (eth.taipei@gmail.com)
  │ Label: TEM-submissions
  │ Subject filter: "TEM 專欄投稿：*"
  ▼
┌───────────────────────────────────────────────────┐
│              Main Workflow                        │
│                                                   │
│  Gmail Trigger (poll every day)                   │
│    → Extract Info (parse email fields)            │
│      → Read Log for Dedup (Google Sheets Read)    │
│        → Check Duplicate (stop if already done)   │
│          → Fetch Article (HTTP, continue on fail) │
│            → Get row(s) in sheet (Read History)   │
│              → Format History (build AI context)  │
│                → AI Assign (GPT-4o HTTP Request)  │
│                  → Parse AI Response              │
│                    ├→ Send Telegram notification  │
│                    └→ Append row in sheet (log)   │
│                                                   │
│  Error Workflow: TEM Reviewer Bot - Error Alert   │
│    Error Trigger → Telegram (alert to admin)      │
└───────────────────────────────────────────────────┘
        │                    │
        ▼                    ▼
  Google Sheets           Telegram
  (Reviewer Log)     (Reviewers Group)
```

## Node Settings Summary

| Node | Type | Key Settings |
|------|------|-------------|
| Gmail Trigger | Gmail Trigger | Label filter: `TEM-submissions`, Poll: Every day at 10:00 AM |
| Extract Info | Code (JS) | Run Once for All Items |
| Read Log for Dedup | Google Sheets (Read) | **Always Output Data = ON** |
| Check Duplicate | Code (JS) | **Always Output Data = OFF** |
| Fetch Article | HTTP Request | On Error: Continue (both outputs → next node) |
| Get row(s) in sheet | Google Sheets (Read) | **Always Output Data = ON** |
| Format History | Code (JS) | **Always Output Data = ON** |
| AI Assign | HTTP Request | POST to OpenAI, Expression mode JSON body |
| Parse AI Response | Code (JS) | Run Once for All Items |
| Telegram | Telegram | Parse Mode: HTML |
| Append row in sheet | Google Sheets (Append) | Maps all fields including EmailId |

## Project Structure

```
tem-reviewer-bot/
├── README.md                   # This file
├── .gitignore
├── config/
│   ├── reviewer_config.md      # Reviewer list with categories (source of truth)
│   ├── ai_system_prompt.txt    # AI system prompt (edit this to change AI behavior)
│   ├── ai_assign_expression.md # Reference doc for the n8n expression
│   └── ai_assign_expression_generated.txt  # Generated expression (paste into n8n)
├── scripts/
│   └── generate_expression.py  # Generates n8n expression from system prompt
├── n8n/
│   ├── extract_info.js         # Code node: parse Gmail data
│   ├── check_duplicate.js      # Code node: deduplication logic
│   ├── format_history.js       # Code node: format Sheets history for AI
│   ├── parse_ai_response.js    # Code node: parse AI JSON response
│   ├── telegram_message_template.html    # Telegram notification template
│   └── error_notification_template.html  # Error alert template
└── docs/
    ├── setup_guide.md          # Step-by-step setup instructions
    ├── maintenance_guide.md    # How to update reviewers, troubleshoot, etc.
    └── n8n_cloud_migration.md  # Guide for migrating to n8n Cloud
```

## Quick Start

See [docs/setup_guide.md](docs/setup_guide.md) for full setup instructions.

## Updating Reviewers

1. Edit `config/reviewer_config.md` with the new reviewer list
2. Edit `config/ai_system_prompt.txt` to match
3. Run `python scripts/generate_expression.py`
4. Copy the generated expression from `config/ai_assign_expression_generated.txt`
5. Paste into the n8n AI Assign node's JSON body field (Expression mode)
6. Git commit

See [docs/maintenance_guide.md](docs/maintenance_guide.md) for details.

## Google Sheet Schema

**Sheet name:** TEM Reviewer Log

| Column | Header | Description |
|--------|--------|-------------|
| A | Date | Assignment date (YYYY-MM-DD) |
| B | Subject | Email subject line |
| C | Reviewer1 | First assigned reviewer |
| D | Reviewer2 | Second assigned reviewer |
| E | Category | Article category |
| F | Sender | Submitter name |
| G | ArticleUrl | Link to article draft |
| H | EmailId | Gmail message ID (for deduplication) |

## Dependencies

- **n8n** (self-hosted or cloud)
- **Gmail API** (OAuth2)
- **Google Sheets API** (OAuth2)
- **OpenAI API** (GPT-4o)
- **Telegram Bot API**

## License

Internal tool for Ethereum Meetup Taipei.
