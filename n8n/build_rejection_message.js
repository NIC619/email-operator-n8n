// Node: Build Rejection Message
// Description: Builds the Telegram message when an acceptance is rejected
//              (already accepted or reassigned)
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this on the False branch of "Is Valid Acceptance" If node

const d = $('Validate Acceptance').first().json;

return [{
  json: {
    chat_id: d.chatId,
    parse_mode: "HTML",
    text: d.text
  }
}];
