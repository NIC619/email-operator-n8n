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

## Step 3: Google Sheet

1. Create a Google Sheet named **"TEM Reviewer Log"**
2. Row 1 headers: `Date | Subject | Reviewer1 | Reviewer2 | Category | Sender | ArticleUrl | EmailId | Reviewer1Status | Reviewer2Status`
3. Add a dummy row to prevent empty-sheet issues on first run:
   `2025-01-01 | 初始紀錄（測試用） | test | test | General | test | - | - | | `

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
- Poll: Every Day at 10:00 (or your preferred schedule)
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
- Settings: **Always Output Data = OFF**

### Node 5: Fetch Article (HTTP Request)
- Method: GET
- URL: `{{ $json.articleUrl }}`
- On Error: **Continue (using error output)**
- Connect **both** Success and Error outputs to next node

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

### Node 10: Build Telegram Payload (Code)
- Paste code from `n8n/build_telegram_payload.js`
- Mode: Run Once for All Items
- **Update** `chat_id` to your group chat ID

### Node 11: Send Telegram Notification (HTTP Request)
- Method: POST
- URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage`
- Body: JSON, Expression mode: `{{ $json }}`

### Node 12: Append row in sheet (Google Sheets)
- Operation: Append Row
- Document: TEM Reviewer Log
- Mapping:
  - Date: `{{ $json.date }}`
  - Subject: `{{ $json.subject }}`
  - Reviewer1: `{{ $json.reviewer1 }}`
  - Reviewer2: `{{ $json.reviewer2 }}`
  - Category: `{{ $json.category }}`
  - Sender: `{{ $json.senderName }}`
  - ArticleUrl: `{{ $json.articleUrl }}`
  - EmailId: `{{ $json.emailId }}`

### Main Workflow Connections

```
Gmail Trigger → Extract Info → Read Log for Dedup → Check Duplicate
  → Fetch Article (Success+Error) → Get row(s) in sheet → Format History
    → AI Assign → Parse AI Response ─┬→ Build Telegram Payload → Send Telegram Notification
                                      └→ Append row in sheet
```

## Step 6: Callback & Commands Handler Workflow

Create a **new workflow** named **"TEM Reviewer Bot - Callback Handler"**

### Node 1: Telegram Trigger
- Credential: same Telegram bot
- Trigger On: **Callback Query** AND **Message**

### Node 2: Route Input (Code)
- Paste code from `n8n/route_input.js`

### Node 3: Route Type (If)
- Condition: `{{ $json._type }}` is equal to `callback`
- Enable **"Convert types where required"**

---

### True branch — Callback (reviewer clicks ✅ button):

**Node: Parse Callback (Code)**
- Paste from `n8n/parse_callback.js`

**Node: Answer Callback (HTTP Request)**
- Method: POST
- URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/answerCallbackQuery`
- Body: JSON, Expression mode: `{{ {callback_query_id: $json.callbackQueryId, text: '已確認！'} }}`
- Settings → On Error: **Continue**

**Node: Build Confirmation (Code)**
- Paste from `n8n/build_confirmation.js`

**Node: Send Confirmation (HTTP Request)**
- Method: POST
- URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage`
- Body: JSON, Expression mode: `{{ $json }}`

**Node: Read Log for Status (Google Sheets)**
- Operation: Read Rows
- Document: TEM Reviewer Log
- Settings: **Always Output Data = ON**

**Node: Update Status Row (Code)**
- Paste from `n8n/update_status_row.js`

**Node: Write Status (Google Sheets)**
- Operation: Update Row
- Document: TEM Reviewer Log
- Match on: `EmailId`
- Map: `Reviewer1Status`, `Reviewer2Status`

**Connections:**
```
Parse Callback → Answer Callback → Build Confirmation
  ├→ Send Confirmation
  └→ Read Log for Status → Update Status Row → Write Status
```

---

### False branch — Reassign command (`/reassign`):

**Node: Parse Reassign Command (Code)**
- Paste from `n8n/parse_reassign_command.js`

**Node: Check Parse Error (If)**
- Condition: `{{ $json.parseError }}` is equal to `true`
- Enable **"Convert types where required"**

**True (parse error) → Node: Build Error Reply (Code)**
- Paste from `n8n/build_error_reply.js`

**→ Node: Send Error Reply (HTTP Request)**
- Method: POST
- URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage`
- Body: JSON, Expression mode: `{{ $json }}`

**False (valid command) → Node: Read for Reassign (Google Sheets)**
- Operation: Read Rows
- Document: TEM Reviewer Log
- Settings: **Always Output Data = ON**

**→ Node: Find and Reassign (Code)**
- Paste from `n8n/find_and_reassign.js`

**→ Node: Should Update Sheet (If)**
- Condition: `{{ $json.shouldUpdate }}` is equal to `true`
- Enable **"Convert types where required"**

**True → Node: Write Reassignment (Google Sheets)**
- Operation: Update Row
- Document: TEM Reviewer Log
- Match on: `EmailId` = `{{ $json.updatedRow.EmailId }}`
- Map:
  - Reviewer1: `{{ $json.updatedRow.Reviewer1 }}`
  - Reviewer2: `{{ $json.updatedRow.Reviewer2 }}`
  - Reviewer1Status: `{{ $json.updatedRow.Reviewer1Status }}`
  - Reviewer2Status: `{{ $json.updatedRow.Reviewer2Status }}`

**Both True and False → Node: Build Reassign Reply (Code)**
- Paste from `n8n/build_reassign_reply.js`

**→ Node: Send Reassign Reply (HTTP Request)**
- Method: POST
- URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage`
- Body: JSON, Expression mode: `{{ $json }}`

**Connections:**
```
Parse Reassign Command → Check Parse Error (If)
  ├─ True → Build Error Reply → Send Error Reply
  └─ False → Read for Reassign → Find and Reassign → Should Update Sheet (If)
              ├─ True → Write Reassignment ──→ Build Reassign Reply → Send Reassign Reply
              └─ False ──────────────────────→ Build Reassign Reply → Send Reassign Reply
```

**Important:** Both True and False outputs of "Should Update Sheet" must connect to "Build Reassign Reply".

### Activate this workflow.

## Step 7: Error Notification Workflow

1. Create a **new workflow** named "TEM Reviewer Bot - Error Alert"
2. Add an **Error Trigger** node
3. Connect to a **Telegram** node:
   - Chat ID: **your personal chat ID** (not the group)
   - Additional Fields → Parse Mode: HTML
   - Text: paste from `n8n/error_notification_template.html`
4. Save and **activate**
5. In **main workflow** → Settings → Error Workflow → select this workflow

## Step 8: Test

### End-to-end test
1. Send a test email to `eth.taipei@gmail.com` with subject `TEM 專欄投稿：測試文章`
2. Run the main workflow
3. Verify Telegram notification with inline ✅ buttons appears
4. Click a ✅ button — verify confirmation message appears
5. Check Google Sheet — verify row created and status updated

### Deduplication test
6. Run the main workflow again — verify it stops at Check Duplicate

### Manual override test
7. In Telegram, send: `/reassign 測試 sc0vu jerry9988`
8. Verify reassignment confirmation message
9. Check Google Sheet — verify reviewer and status updated
10. Test quoted keywords: `/reassign "測試文章" sc0vu jerry9988`

### Error handling test
11. Temporarily break something (e.g., invalid OpenAI key)
12. Run the workflow
13. Verify error alert on your personal Telegram
