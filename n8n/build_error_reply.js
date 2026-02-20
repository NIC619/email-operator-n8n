// Node: Build Error Reply
// Description: Builds the Telegram error message when /reassign command has wrong format
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this AFTER "Check Parse Error" (True branch) and BEFORE "Send Error Reply"

return [{
  json: {
    chat_id: $json.chatId,
    parse_mode: "HTML",
    text: $json.text
  }
}];
