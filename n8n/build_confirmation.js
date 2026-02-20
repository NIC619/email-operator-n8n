// Node: Build Confirmation
// Description: Builds the confirmation message after a reviewer clicks accept
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this AFTER "Answer Callback" and BEFORE "Send Confirmation"

const d = $('Parse Callback').first().json;

const text = d.clickerUsername === d.reviewerName
  ? '✅ @' + d.reviewerName + ' 已接受審稿任務！'
  : '✅ @' + d.clickerUsername + ' 代 @' + d.reviewerName + ' 接受審稿任務。';

return [{
  json: {
    chat_id: d.chatId,
    parse_mode: "HTML",
    reply_to_message_id: Number(d.messageId),
    text: text
  }
}];
