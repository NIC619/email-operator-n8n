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
   - Scope: `https://mail.google.com/` (full access, required by n8n)

## Step 2: Gmail Filter

1. Log into `eth.taipei@gmail.com`
2. Settings → Filters → Create filter
3. Subject: `TEM 專欄投稿：`
4. Action: Apply label `TEM-submissions` + Forward to your personal Gmail
5. In n8n, configure Gmail Trigger to filter by the `TEM-submissions` label

## Step 3: Google Sheet

1. Create a Google Sheet named **"TEM Reviewer Log"**
2. Row 1 headers: `Date | Subject | Reviewer1 | Reviewer2 | Category | Sender | ArticleUrl | EmailId`
3. Add a dummy row to prevent empty-sheet issues on first run:
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

## Step 5: Main Workflow — Node by Node

### Node 1: Gmail Trigger
- Credential: Gmail OAuth (authenticate with your personal account)
- Poll: Every day at 10:00 AM
- Filter by label: `TEM-submissions`

### Node 2: Extract Info (Code)
- Paste code from `n8n/extract_info.js`
- Mode: Run Once for All Items

### Node 3: Read Log for Dedup (Google Sheets)
- Operation: Read Rows
- Document: TEM Reviewer Log
- Sheet: Sheet1
- Settings: **Always Output Data = ON**

### Node 4: Check Duplicate (Code)
- Paste code from `n8n/check_duplicate.js`
- Mode: Run Once for All Items
- Settings: **Always Output Data = OFF** (important — empty return stops duplicates)

### Node 5: Fetch Article (HTTP Request)
- Method: GET
- URL: `{{ $json.articleUrl }}`
- On Error: **Continue (using error output)**
- Connect **both** Success and Error outputs to the next node

### Node 6: Get row(s) in sheet (Google Sheets)
- Operation: Read Rows
- Document: TEM Reviewer Log
- Sheet: Sheet1
- Settings: **Always Output Data = ON**

### Node 7: Format History (Code)
- Paste code from `n8n/format_history.js`
- Mode: Run Once for All Items
- Settings: **Always Output Data = ON**

### Node 8: AI Assign (HTTP Request)
- Method: POST
- URL: `https://api.openai.com/v1/chat/completions`
- Auth: Generic Credential Type → Header Auth
  - Name: `Authorization`
  - Value: `Bearer YOUR_OPENAI_API_KEY`
- Send Headers: `Content-Type: application/json`
- Send Body: JSON
- Specify Body: **Using JSON**, toggled to **Expression** mode
- Paste the expression from `config/ai_assign_expression_generated.txt`
  - Generate it first: `python scripts/generate_expression.py`

### Node 9: Parse AI Response (Code)
- Paste code from `n8n/parse_ai_response.js`
- Mode: Run Once for All Items

### Node 10: Send a text message (Telegram)
- Bot token credential
- Chat ID: your reviewers group chat ID
- Additional Fields → Parse Mode: **HTML**
- Text: paste from `n8n/telegram_message_template.html`

### Node 11: Append row in sheet (Google Sheets)
- Operation: Append Row
- Document: TEM Reviewer Log
- Sheet: Sheet1
- Mapping:
  - Date: `{{ $json.date }}`
  - Subject: `{{ $json.subject }}`
  - Reviewer1: `{{ $json.reviewer1 }}`
  - Reviewer2: `{{ $json.reviewer2 }}`
  - Category: `{{ $json.category }}`
  - Sender: `{{ $json.senderName }}`
  - ArticleUrl: `{{ $json.articleUrl }}`
  - EmailId: `{{ $json.emailId }}`

### Connections

```
Gmail Trigger
  → Extract Info
    → Read Log for Dedup
      → Check Duplicate
        → Fetch Article ─┬─ Success ─→ Get row(s) in sheet
                         └─ Error   ─→ Get row(s) in sheet
                                           → Format History
                                             → AI Assign
                                               → Parse AI Response ─┬→ Append row in sheet
                                                                    └→ Send a text message
```

## Step 6: Error Notification Workflow

1. Create a **new separate workflow** named "TEM Reviewer Bot - Error Alert"
2. Add an **Error Trigger** node (this is the only trigger)
3. Connect to a **Telegram** node:
   - Same bot credential
   - Chat ID: **your personal chat ID** (not the group — admin alerts go to you)
   - Additional Fields → Parse Mode: HTML
   - Text: paste from `n8n/error_notification_template.html`
4. Save and **activate** this workflow
5. Go back to the **main workflow** → Settings (gear icon) → **Error Workflow** → select "TEM Reviewer Bot - Error Alert"
6. Save the main workflow

## Step 7: Test

### End-to-end test
1. Send a test email to `eth.taipei@gmail.com` with subject `TEM 專欄投稿：測試文章`
2. Wait for the Gmail filter to apply the label
3. In n8n, click **"Test Workflow"** to run the full chain
4. Verify:
   - ✅ Telegram message received with correct formatting
   - ✅ Google Sheet has new row with all fields including EmailId

### Deduplication test
5. Click **"Test Workflow"** again with the same email
6. Verify:
   - ✅ Workflow stops at Check Duplicate node
   - ✅ No second Telegram message
   - ✅ No duplicate row in Google Sheet

### Error handling test
7. Temporarily break something (e.g., invalid OpenAI key)
8. Run the workflow
9. Verify:
   - ✅ You receive an error alert on your personal Telegram

### Activate
10. Toggle the workflow **Active** (top right switch)
11. The workflow will now run automatically every 15 minutes
