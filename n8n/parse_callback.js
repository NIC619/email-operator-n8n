// Node: Parse Callback
// Description: Parses the Telegram inline keyboard callback query data
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler

const update = $input.first().json;
const cbq = update.callback_query || update;
const data = cbq.data || '';
const from = cbq.from || {};
const message = cbq.message || {};

// Parse callback_data: "accept_sc0vu_19c7988a7950517f"
const parts = data.split('_');
const action = parts[0];
const reviewerName = parts[1];
const emailId = parts.slice(2).join('_');

return [{
  json: {
    action,
    reviewerName,
    emailId,
    clickerUsername: from.username || '',
    messageId: message.message_id || '',
    chatId: (message.chat?.id || '').toString(),
    callbackQueryId: cbq.id || ''
  }
}];
