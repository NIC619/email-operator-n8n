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
10. **Supports manual override** — `/reassign` command in Telegram to swap reviewers
11. **Alerts** on errors via a separate Telegram notification to admin

## Architecture

```
Gmail (eth.taipei@gmail.com)
  │ Label: TEM-submissions
  │ Subject filter: "TEM 專欄投稿：*"
  ▼
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
        │                    │
        ▼                    ▼
  Google Sheets           Telegram
  (Reviewer Log)     (Reviewers Group)

┌──────────────────────────────────────────────────────┐
│  Callback & Commands Workflow:                        │
│  TEM Reviewer Bot - Callback Handler                  │
│                                                        │
│  Telegram Trigger (Callback Query + Message)          │
│    → Route Input                                      │
│      → Route Type (If: _type === 'callback')          │
│        ├─ True (Callback button click):               │
│        │   Parse Callback → Answer Callback           │
│        │     → Build Confirmation                     │
│        │       ├→ Send Confirmation                   │
│        │       └→ Read Log → Update Status → Write    │
│        │                                              │
│        └─ False (Reassign command):                   │
│            Parse Reassign Command                     │
│              → Check Parse Error                      │
│                ├→ Error Reply                         │
│                └→ Read Sheet → Find and Reassign      │
│                    → Should Update Sheet              │
│                      ├→ Write Reassignment            │
│                      └→ Build Reply → Send Reply      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Error Workflow: TEM Reviewer Bot - Error Alert       │
│                                                        │
│  Error Trigger → Telegram (alert to admin)            │
└──────────────────────────────────────────────────────┘
```

## Node Settings Summary

### Main Workflow

| Node | Type | Key Settings |
|------|------|-------------|
| Gmail Trigger | Gmail Trigger | Label filter: `TEM-submissions`, Poll: daily 10 AM |
| Extract Info | Code (JS) | Run Once for All Items |
| Read Log for Dedup | Google Sheets (Read) | **Always Output Data = ON** |
| Check Duplicate | Code (JS) | **Always Output Data = OFF** |
| Fetch Article | HTTP Request | On Error: Continue (both outputs → next node) |
| Get row(s) in sheet | Google Sheets (Read) | **Always Output Data = ON** |
| Format History | Code (JS) | **Always Output Data = ON** |
| AI Assign | HTTP Request | POST to OpenAI, Expression mode JSON body |
| Parse AI Response | Code (JS) | Run Once for All Items |
| Build Telegram Payload | Code (JS) | Builds message with inline keyboard |
| Send Telegram Notification | HTTP Request | POST to Telegram API, Body: `{{ $json }}` |
| Append row in sheet | Google Sheets (Append) | Maps all fields including EmailId |

### Callback & Commands Workflow

| Node | Type | Key Settings |
|------|------|-------------|
| Telegram Trigger | Telegram Trigger | Updates: Callback Query + Message |
| Route Input | Code (JS) | Routes to callback or reassign flow |
| Route Type | If | `_type === 'callback'`, Convert types ON |
| Parse Callback | Code (JS) | Extracts action, reviewer, clicker |
| Answer Callback | HTTP Request | POST answerCallbackQuery, On Error: Continue |
| Build Confirmation | Code (JS) | References Parse Callback via `$()` |
| Send Confirmation | HTTP Request | POST sendMessage, Body: `{{ $json }}` |
| Read Log for Status | Google Sheets (Read) | **Always Output Data = ON** |
| Update Status Row | Code (JS) | Matches EmailId, prepares status |
| Write Status | Google Sheets (Update) | Match on EmailId column |
| Parse Reassign Command | Code (JS) | Supports quoted keywords |
| Check Parse Error | If | `parseError === true`, Convert types ON |
| Build Error Reply | Code (JS) | Formats parse error message |
| Send Error Reply | HTTP Request | POST sendMessage, Body: `{{ $json }}` |
| Read for Reassign | Google Sheets (Read) | **Always Output Data = ON** |
| Find and Reassign | Code (JS) | Matches subject keyword, prepares update |
| Should Update Sheet | If | `shouldUpdate === true`, Convert types ON |
| Write Reassignment | Google Sheets (Update) | Match on EmailId, updates Reviewer + Status |
| Build Reassign Reply | Code (JS) | Formats success/error message |
| Send Reassign Reply | HTTP Request | POST sendMessage, Body: `{{ $json }}` |

## Telegram Commands

### `/reassign`
Manually reassign a reviewer for an article.

**Format:**
```
/reassign <subject_keyword> <old_reviewer> <new_reviewer>
/reassign "<multi word keyword>" <old_reviewer> <new_reviewer>
```

**Examples:**
```
/reassign Foundry sc0vu jerry9988
/reassign "測試 n8n" sc0vu jerry9988
```

**Behavior:**
- Searches for the most recent article matching the subject keyword
- Replaces the old reviewer with the new one in Google Sheets
- Sends a confirmation message to the group
- Logs the change with who performed it

## Project Structure

```
tem-reviewer-bot/
├── README.md
├── .gitignore
├── config/
│   ├── reviewer_config.md                  # Reviewer list with categories (source of truth)
│   ├── ai_system_prompt.txt                # AI system prompt (edit this to change AI behavior)
│   ├── ai_assign_expression.md             # Reference doc for n8n expression
│   └── ai_assign_expression_generated.txt  # Generated expression (paste into n8n)
├── scripts/
│   └── generate_expression.py              # Generates n8n expression from system prompt
├── n8n/
│   ├── # Main workflow nodes
│   ├── extract_info.js                     # Parse Gmail trigger data
│   ├── check_duplicate.js                  # Deduplication logic
│   ├── format_history.js                   # Format Sheets history for AI prompt
│   ├── parse_ai_response.js               # Parse AI JSON response
│   ├── build_telegram_payload.js           # Notification with inline ✅ buttons
│   │
│   ├── # Callback handler workflow nodes
│   ├── route_input.js                      # Routes callback vs command
│   ├── parse_callback.js                   # Handles ✅ button clicks
│   ├── build_confirmation.js               # Confirmation message builder
│   ├── update_status_row.js                # Google Sheet status updater
│   │
│   ├── # Manual override nodes
│   ├── parse_reassign_command.js           # Parses /reassign command
│   ├── find_and_reassign.js                # Finds article, prepares update
│   ├── build_reassign_reply.js             # Builds success/error reply
│   ├── build_error_reply.js                # Builds parse error reply
│   │
│   ├── # Templates
│   └── error_notification_template.html    # Error alert template
└── docs/
    ├── setup_guide.md                      # Step-by-step setup instructions
    ├── maintenance_guide.md                # How to update reviewers, troubleshoot
    └── n8n_cloud_migration.md              # Guide for migrating to n8n Cloud
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
| I | Reviewer1Status | Confirmation status |
| J | Reviewer2Status | Confirmation status |

**Status values:**
- `✅ Accepted` — reviewer confirmed themselves
- `✅ username (代 reviewer)` — someone accepted on behalf
- `🔄 Reassigned by @username` — reviewer was manually replaced via `/reassign`

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

## Dependencies

- **n8n** (self-hosted or cloud)
- **Gmail API** (OAuth2)
- **Google Sheets API** (OAuth2)
- **OpenAI API** (GPT-4o)
- **Telegram Bot API**

## License

Internal tool for Ethereum Meetup Taipei.
