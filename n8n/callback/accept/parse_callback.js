// Node: Parse Callback
// Description: Parses the Telegram inline keyboard callback query data.
//              Extracts slot (r1/r2), reviewer name, and email ID.
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
//
// Callback data format: accept_<slot>_<reviewerName>_<emailId>
// Example: accept_r1_sc0vu_19c7988a7950517f

const update = $input.first().json;
const cbq = update.callback_query || update;
const data = cbq.data || '';
const from = cbq.from || {};
const message = cbq.message || {};

// Parse callback_data: "accept_r1_sc0vu_19c7988a7950517f"
const parts = data.split('_');
const action = parts[0];        // "accept"
const slot = parts[1];           // "r1" or "r2"
const reviewerName = parts[2];   // "sc0vu"
const emailId = parts.slice(3).join('_');

return [{
  json: {
    action,
    slot,
    reviewerName,
    emailId,
    clickerUsername: from.username || '',
    messageId: message.message_id || '',
    chatId: (message.chat?.id || '').toString(),
    callbackQueryId: cbq.id || ''
  }
}];
