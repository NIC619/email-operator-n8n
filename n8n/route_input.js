// Node: Route Input
// Description: Routes Telegram updates to either callback or reassign flow
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this AFTER Telegram Trigger and BEFORE Route Type (If node)

const update = $input.first().json;

const isCallback = !!(update.callback_query);
const isReassign = !!(update.message?.text?.startsWith('/reassign'));

if (isCallback) {
  return [{ json: { ...update, _type: 'callback' } }];
}

if (isReassign) {
  return [{ json: { ...update, _type: 'reassign' } }];
}

// Ignore all other messages
return [];
