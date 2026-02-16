# Setup Guide

## Prerequisites

- Google account with delegate access to `eth.taipei@gmail.com`
- OpenAI API key with billing enabled
- Telegram account
- n8n instance (self-hosted or cloud)

## Step 1: Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable **Gmail API** and **Google Sheets API**
4. Create **OAuth 2.0 credentials** (Web application type)
5. Set redirect URI to your n8n OAuth callback URL:
   - Self-hosted: `http://localhost:5678/rest/oauth2-credential/callback`
   - Cloud: `https://your-instance.app.n8n.cloud/rest/oauth2-credential/callback`
6. OAuth consent screen:
   - User type: External
   - Add your Gmail as a test user
   - Scope: `https://mail.google.com/`

## Step 2: Gmail Filter

1. Log into `eth.taipei@gmail.com`
2. Settings → Filters → Create filter
3. Subject: `TEM 專欄投稿：`
4. Action: Apply label `TEM-submissions` + Forward to your personal Gmail
5. In n8n, configure Gmail Trigger to filter by the `TEM-submissions` label

## Step 3: Google Sheet

1. Create a Google Sheet named **"TEM Reviewer Log"**
2. Row 1 headers: `Date | Subject | Reviewer1 | Reviewer2 | Category | Sender | ArticleUrl | EmailId`
3. Add a dummy row to prevent empty-sheet issues:
   `2025-01-01 | 初始紀錄（測試用） | test | test | General | test | - | -`

## Step 4: Telegram Bot

1. Message **@BotFather** on Telegram → `/newbot`
2. Name it (e.g., "TEM Reviewer Bot")
3. Copy the **bot token**
4. Add the bot to your reviewers Telegram group
5. Make it a group admin
6. Get group chat ID:
   - Add `@raw_data_bot` to the group
   - Send any message
   - Copy the `chat.id` (negative number like `-1001234567890`)
   - Remove `@raw_data_bot`

## Step 5: n8n Workflow

### Node 1: Gmail Trigger
- Credential: Gmail OAuth
- Poll: Every 15 minutes
- Filter by label: `TEM-submissions`

### Node 2: Extract Info (Code)
- Paste code from `n8n/extract_info.js`
- Mode: Run Once for All Items

### Node 3: Fetch Article (HTTP Request)
- Method: GET
- URL: `{{ $json.articleUrl }}`
- On Error: Continue (using error output)
- Both Success and Error outputs → next node

### Node 4: Get row(s) in sheet (Google Sheets)
- Operation: Read Rows
- Document: TEM Reviewer Log
- Sheet: Sheet1

### Node 5: Format History (Code)
- Paste code from `n8n/format_history.js`
- Mode: Run Once for All Items
- Settings: **Always Output Data = ON**

### Node 6: AI Assign (HTTP Request)
- Method: POST
- URL: `https://api.openai.com/v1/chat/completions`
- Auth: Header Auth (Name: `Authorization`, Value: `Bearer YOUR_KEY`)
- Body: JSON, Expression mode
- Paste expression from `config/ai_assign_expression.md` (or generate via script)

### Node 7: Parse AI Response (Code)
- Paste code from `n8n/parse_ai_response.js`
- Mode: Run Once for All Items

### Node 8: Telegram — Send Message
- Bot token credential
- Chat ID: your group chat ID
- Parse Mode: HTML
- Text: paste from `n8n/telegram_message_template.html`

### Node 9: Google Sheets — Append Row
- Document: TEM Reviewer Log
- Mapping:
  - Date: `{{ $json.date }}`
  - Subject: `{{ $json.subject }}`
  - Reviewer1: `{{ $json.reviewer1 }}`
  - Reviewer2: `{{ $json.reviewer2 }}`
  - Category: `{{ $json.category }}`
  - Sender: `{{ $json.senderName }}`
  - ArticleUrl: `{{ $json.articleUrl }}`

### Connections

```
Gmail Trigger → Extract Info → Fetch Article (Success+Error) → Get row(s) in sheet → Format History → AI Assign → Parse AI Response ─┬→ Append row in sheet
                                                                                                                                      └→ Send a text message (Telegram)
```

## Step 6: Error Notification Workflow

1. Create a **new workflow** (separate from the main one)
2. Add an **Error Trigger** node
3. Connect to a **Telegram** node:
   - Same bot credential
   - Chat ID: your personal chat ID (for admin alerts)
   - Parse Mode: HTML
   - Text: paste from `n8n/error_notification_template.html`
4. In the **main workflow** settings → Error Workflow → select this error workflow

## Step 7: Test

1. Send a test email to `eth.taipei@gmail.com` with subject `TEM 專欄投稿：測試文章`
2. Wait for the Gmail filter to apply the label
3. In n8n, trigger the workflow manually or wait for the poll
4. Verify Telegram message and Google Sheet entry
