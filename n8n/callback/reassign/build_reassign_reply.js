// Node: Build Reassign Reply
// Description: Builds the Telegram reply message for reassignment results
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this BEFORE "Send Reassign Reply" (HTTP Request)
// Receives input from both True and False branches of "Should Update Sheet"

const d = $('Find and Reassign').first().json;

return [{
  json: {
    chat_id: d.chatId,
    parse_mode: "HTML",
    text: d.text
  }
}];
