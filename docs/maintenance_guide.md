# Maintenance Guide

## Updating the Reviewer List

When reviewers join, leave, or change specialties:

### Quick method (manual)

1. Edit `config/ai_system_prompt.txt.example` with the changes (then remove the `.example` postfix so it becomes `ai_system_prompt.txt`)
2. Open n8n → AI Assign node → edit the JSON body expression
3. Find the reviewer list section in the system prompt and update it
4. Test with a sample email

### Script method (recommended)

1. Edit `config/ai_system_prompt.txt.example` with the updated reviewer list (then remove the `.example` postfix so it becomes `ai_system_prompt.txt`)
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

1. Add the category to `config/ai_system_prompt.txt` (edit `ai_system_prompt.txt.example` first, then remove the `.example` postfix) following the same format:
   ```
   ### Category Name
   Description of topics covered
   Reviewers: name1, name2, name3
   ```
3. Regenerate the expression and update n8n

## Troubleshooting

### Workflow not triggering
- Check Gmail filter is applying the `TEM-submissions` label
- Check n8n workflow is **active** (toggle in top right)
- Check poll interval (every 15 minutes by default)

### AI returns wrong reviewers
- Check the system prompt matches the current reviewer list
- Review the Format History output — is history being passed correctly?
- Try lowering the temperature (e.g., 0.2) for more consistent results

### Telegram message not sending
- Verify bot is still a group admin
- Check chat ID hasn't changed (can happen if group is migrated to supergroup)
- Test bot token: `https://api.telegram.org/bot<TOKEN>/getMe`

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

### Error workflow
The error notification workflow sends you a Telegram message when any node fails. Check these promptly as submissions may need manual processing.

## Backup

### Export n8n workflow
1. In n8n, go to the workflow
2. Click the three dots menu → Download
3. Save the JSON file to the `n8n/` directory
4. Commit to git

### Google Sheet
The sheet is in Google Drive and automatically backed up by Google. For extra safety, periodically download a CSV copy.
