# Git Hooks

## Pre-commit: Secret leak detection

The `pre-commit` hook scans staged files for:

- **Telegram bot tokens** (format: `123456789:ABCdef...`)
- **API keys** (`api_key`, `apikey`, etc.)
- **OpenAI keys** (`sk-...`, `sk-proj-...`)
- **AWS keys** (`AKIA...`)
- **Generic secrets** (`secret_key`, `bearer`, etc.)
- **Telegram API URLs** with embedded real tokens

Placeholders like `<YOUR_BOT_TOKEN>` are ignored.

### Setup (one-time)

```bash
git config core.hooksPath .githooks
```

This makes Git use the hooks in this folder instead of `.git/hooks/`.

### Bypass (emergency only)

```bash
git commit --no-verify -m "message"
```

Use sparingly; prefer fixing the leak and using env vars or `.env`.
