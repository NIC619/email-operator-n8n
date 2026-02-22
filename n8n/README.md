# n8n Code Nodes

This directory contains the JavaScript code for all n8n workflow code nodes, organized by workflow.

## Folder Structure

### `main/`
**Workflow: TEM Reviewer Bot** — The main workflow that processes incoming submission emails, assigns reviewers via AI, and sends Telegram notifications with inline accept buttons.

### `callback/`
**Workflow: TEM Reviewer Bot - Callback Handler** — Handles all Telegram interactions: button clicks and bot commands.

- `route_input.js` — Shared entry point that routes incoming Telegram updates to the correct sub-flow
- `accept/` — Handles ✅ button clicks with validation (prevents double-accepts and accepts on reassigned slots)
- `reassign/` — Handles `/reassign` command for manual reviewer swaps
- `status/` — Handles `/status` command for checking current reviewer assignments

### `error/`
**Workflow: TEM Reviewer Bot - Error Alert** — Sends admin alerts when any workflow node fails.

### `exports/`
Manual backups of n8n workflow JSON exports (via workflow menu → Download). These contain the full node configuration but no credentials.