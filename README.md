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
7. **Notifies** the reviewers group via Telegram with @mentions and inline accept buttons
8. **Logs** the assignment in Google Sheets for history tracking and deduplication
9. **Handles reviewer confirmation** — reviewers click ✅ to accept, status is logged in the sheet
10. **Alerts** on errors via a separate Telegram notification to admin

## Architecture

```
┌──────────────────────────────────────────────────────┐
│         Main Workflow: TEM Reviewer Bot               │
│                                                        │
│  Gmail Trigger (poll daily at 10 AM)                  │
│    → Extract Info (parse email fields)                │
│      → Read Log for Dedup (Google Sheets Read)        │
│        → Check Duplicate (stop if already done)       │
│          → Fetch Article (HTTP, continue on fail)     │
│            → Get row(s) in sheet (Read History)       │
│              → Format History (build AI context)      │
│                → AI Assign (GPT-4o HTTP Request)      │
│                  → Parse AI Response                  │
│                    ├→ Build Telegram Payload           │
│                    │   → Send Telegram Notification    │
│                    └→ Append row in sheet (log)       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│    Callback Workflow: TEM Reviewer Bot - Callback     │
│                                                        │
│  Telegram Trigger (Callback Query)                    │
│    → Parse Callback                                   │
│      → Answer Callback (dismiss spinner)              │
│        → Build Confirmation                           │
│          ├→ Send Confirmation (Telegram)              │
│          └→ Read Log for Status (Google Sheets)       │
│              → Update Status Row                      │
│                → Write Status (Google Sheets Update)  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│    Error Workflow: TEM Reviewer Bot - Error Alert      │
│                                                        │
│  Error Trigger → Telegram (alert to admin)            │
└──────────────────────────────────────────────────────┘
```

## Node Settings Summary

### Main Workflow

| Node | Type | Key Settings |
|------|------|-------------|
| Gmail Trigger | Gmail Trigger | Label filter, Poll: daily 10 AM |
| Extract Info | Code (JS) | Run Once for All Items |
| Read Log for Dedup | Google Sheets (Read) | **Always Output Data = ON** |
| Check Duplicate | Code (JS) | **Always Output Data = OFF** |
| Fetch Article | HTTP Request | On Error: Continue (both outputs → next) |
| Get row(s) in sheet | Google Sheets (Read) | **Always Output Data = ON** |
| Format History | Code (JS) | **Always Output Data = ON** |
| AI Assign | HTTP Request | POST to OpenAI, Expression mode |
| Parse AI Response | Code (JS) | Run Once for All Items |
| Build Telegram Payload | Code (JS) | Builds message with inline keyboard |
| Send Telegram Notification | HTTP Request | POST to Telegram API, Body: `{{ $json }}` |
| Append row in sheet | Google Sheets (Append) | Maps all fields including EmailId |

### Callback Handler Workflow

| Node | Type | Key Settings |
|------|------|-------------|
| Telegram Trigger | Telegram Trigger | Updates: Callback Query |
| Parse Callback | Code (JS) | Extracts action, reviewer, clicker |
| Answer Callback | HTTP Request | POST answerCallbackQuery, On Error: Continue |
| Build Confirmation | Code (JS) | References Parse Callback via `$()` |
| Send Confirmation | HTTP Request | POST sendMessage, Body: `{{ $json }}` |
| Read Log for Status | Google Sheets (Read) | **Always Output Data = ON** |
| Update Status Row | Code (JS) | Matches EmailId, prepares status |
| Write Status | Google Sheets (Update) | Match on EmailId column |

## Project Structure

```
tem-reviewer-bot/
├── README.md
├── .gitignore
├── config/
│   ├── reviewer_config.md                  # Reviewer list (source of truth)
│   ├── ai_system_prompt.txt                # AI system prompt
│   ├── ai_assign_expression.md             # Reference doc for n8n expression
│   └── ai_assign_expression_generated.txt  # Generated expression (paste into n8n)
├── scripts/
│   └── generate_expression.py              # Generates n8n expression from prompt
├── n8n/
│   ├── # Main workflow nodes
│   ├── extract_info.js
│   ├── check_duplicate.js
│   ├── format_history.js
│   ├── parse_ai_response.js
│   ├── build_telegram_payload.js           # Notification with inline buttons
│   │
│   ├── # Callback handler workflow nodes
│   ├── parse_callback.js
│   ├── build_confirmation.js
│   ├── update_status_row.js
│   │
│   ├── # Templates
│   └── error_notification_template.html
└── docs/
    ├── setup_guide.md
    ├── maintenance_guide.md
    └── n8n_cloud_migration.md
```

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
| I | Reviewer1Status | Confirmation status (e.g., ✅ Accepted) |
| J | Reviewer2Status | Confirmation status |

## Quick Start

See [docs/setup_guide.md](docs/setup_guide.md) for full setup instructions.

## Updating Reviewers

1. Edit `config/reviewer_config.md` with the new reviewer list
2. Edit `config/ai_system_prompt.txt` to match
3. Run `python scripts/generate_expression.py`
4. Copy `config/ai_assign_expression_generated.txt` into n8n AI Assign node
5. Git commit

See [docs/maintenance_guide.md](docs/maintenance_guide.md) for details.

## Dependencies

- **n8n** (self-hosted or cloud)
- **Gmail API** (OAuth2)
- **Google Sheets API** (OAuth2)
- **OpenAI API** (GPT-4o)
- **Telegram Bot API**

## License

Internal tool for Ethereum Meetup Taipei.
