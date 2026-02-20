# Maintenance Guide

## Updating the Reviewer List

When reviewers join, leave, or change specialties:

### Quick method (manual)

1. Edit `config/reviewer_config.md` with the changes
2. Edit `config/ai_system_prompt.txt` to match
3. Open n8n → AI Assign node → edit the JSON body expression
4. Find the reviewer list section in the system prompt and update it
5. Test with a sample email

### Script method (recommended)

1. Edit `config/ai_system_prompt.txt` with the updated reviewer list
2. Run the generator script:
   ```bash
   python scripts/generate_expression.py
   ```
3. Open the generated file: `config/ai_assign_expression_generated.txt`
4. Copy the entire contents
5. In n8n → AI Assign node → JSON body → Expression mode → paste
6. Test with a sample email
7. Commit changes to git

## Adding a New Category

1. Add the category to `config/reviewer_config.md`
2. Add it to `config/ai_system_prompt.txt` following the same format:
   ```
   ### Category Name
   Description of topics covered
   Reviewers: name1, name2, name3
   ```
3. Regenerate the expression and update n8n

## Updating Telegram Group Chat ID

If the group changes (e.g., migrated to supergroup):
1. Get the new chat ID via `@raw_data_bot`
2. Update `chat_id` in the **Build Telegram Payload** code node (main workflow)
3. Update `chat_id` in the **Build Confirmation** code node if hardcoded

## Troubleshooting

### Workflow not triggering
- Check Gmail filter is applying the label
- Check n8n workflow is **Published** (green indicator top right)
- Check poll schedule and timezone in workflow settings

### AI returns wrong reviewers
- Check the system prompt matches the current reviewer list
- Review the Format History output — is history being passed correctly?
- Try lowering the temperature (e.g., 0.2) for more consistent results

### Telegram message not sending
- Verify bot is still a group admin
- Check chat ID hasn't changed (can happen if group migrates to supergroup)
- Test bot token: `https://api.telegram.org/bot<TOKEN>/getMe`

### Inline buttons not working
- Verify the **Callback Handler workflow** is activated
- Check that the Telegram Trigger node is set to **Callback Query**
- Ensure the bot token in the callback workflow matches the main workflow

### "query is too old" error on Answer Callback
- This is normal when testing step-by-step — Telegram requires answering within 30 seconds
- In production this doesn't happen since all nodes execute automatically
- Set Answer Callback → Settings → On Error → Continue

### Google Sheets errors
- Check OAuth token hasn't expired (re-authenticate in n8n)
- Verify sheet headers match expected column names exactly
- Check sheet hasn't been renamed or moved

### Duplicate notifications
- Verify the Check Duplicate node is in the workflow
- Check the EmailId column exists in Google Sheet
- Ensure the Read Log for Dedup node runs before Check Duplicate

### OpenAI rate limits / errors
- Check billing at platform.openai.com
- If persistent, consider switching to a different model (gpt-4o-mini is cheaper)
- Add retry logic: AI Assign node → Settings → Retry On Fail = ON

## Monitoring

### Google Sheet as audit log
The TEM Reviewer Log sheet serves as both a history database and audit log. Review it periodically to:
- Check if assignments are balanced across reviewers
- Identify reviewers who are over/under-assigned
- Spot any AI misclassifications
- Track reviewer acceptance rates via Reviewer1Status/Reviewer2Status columns

### Error workflow
The error notification workflow sends you a Telegram message when any node fails. Check these promptly as submissions may need manual processing.

## Backup

### Export n8n workflows
1. In n8n, open each workflow
2. Click the three dots menu → Download
3. Save the JSON files to `n8n/exports/` directory
4. Commit to git

### Google Sheet
The sheet is in Google Drive and automatically backed up by Google. For extra safety, periodically download a CSV copy.
