# Migrating to n8n Cloud

## Why n8n Cloud?

- No server maintenance
- Always-on (no downtime when your laptop sleeps)
- Automatic updates
- Built-in execution history and monitoring

## Migration Steps

### 1. Sign up for n8n Cloud

1. Go to [n8n.io/cloud](https://n8n.io/cloud)
2. Sign up for a plan (Starter at ~$20/mo is sufficient for this workflow)
3. You'll get a URL like `https://your-name.app.n8n.cloud`

### 2. Export your workflow

1. In your self-hosted n8n, open the workflow
2. Click the three dots menu (⋮) → **Download**
3. This saves a `.json` file with the full workflow configuration

### 3. Import to n8n Cloud

1. Log into your n8n Cloud instance
2. Click **"Add workflow"** → **"Import from file"**
3. Select the downloaded JSON file
4. The workflow structure will be imported, but **credentials need to be re-created**

### 4. Re-create credentials

You need to set up each credential again in n8n Cloud:

#### Gmail OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → your project
2. OAuth 2.0 credentials → Edit
3. Add the **n8n Cloud redirect URI**:
   `https://your-name.app.n8n.cloud/rest/oauth2-credential/callback`
4. In n8n Cloud, create a new Gmail credential with the same Client ID/Secret
5. Authenticate

#### Google Sheets
- Usually uses the same OAuth credential as Gmail
- If separate, repeat the steps above

#### OpenAI Header Auth
1. Create new Header Auth credential
2. Name: `Authorization`
3. Value: `Bearer YOUR_OPENAI_API_KEY`

#### Telegram
1. Create new Telegram credential
2. Paste your bot token

### 5. Verify node configurations

After importing, go through each node and:
- Assign the correct credential
- Verify all expressions still work
- Check Google Sheet document references (may need to re-select)

### 6. Test

1. Run the workflow manually with test data
2. Verify each node executes correctly
3. Check Telegram message and Sheet logging

### 7. Activate

1. Toggle the workflow **Active** (top right switch)
2. Deactivate the self-hosted version to avoid duplicates
3. You can shut down your local Docker instance

### 8. Set up error workflow

1. Re-create the error notification workflow on n8n Cloud
2. Link it in the main workflow settings

## Post-Migration Checklist

- [ ] Workflow imported and all nodes green
- [ ] All 4 credentials re-created (Gmail, Sheets, OpenAI, Telegram)
- [ ] Gmail Trigger polling correctly
- [ ] Test email processed end-to-end
- [ ] Telegram notification received
- [ ] Google Sheet row appended
- [ ] Error workflow set up and linked
- [ ] Self-hosted n8n workflow deactivated
- [ ] (Optional) Self-hosted Docker container stopped
