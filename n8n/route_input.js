// Node: Route Input
// Description: Routes Telegram updates to callback, reassign, or status flow
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this AFTER Telegram Trigger and BEFORE Route Type (If node)

const update = $input.first().json;

const isCallback = !!(update.callback_query);
const isReassign = !!(update.message?.text?.startsWith('/reassign'));
const isStatus = !!(update.message?.text?.startsWith('/status'));

if (isCallback) {
  return [{ json: { ...update, _type: 'callback' } }];
}

if (isReassign) {
  return [{ json: { ...update, _type: 'reassign' } }];
}

if (isStatus) {
  return [{ json: { ...update, _type: 'status' } }];
}

// Ignore all other messages
return [];
