// Node: Parse Status Command
// Description: Parses the /status command from Telegram message.
//              Supports quoted keywords for multi-word subjects.
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
//
// Command format:
//   /status <subject_keyword>
//   /status "<multi word keyword>"
//
// Examples:
//   /status Foundry
//   /status "測試 n8n"

const update = $input.first().json;
const message = update.message || {};
const text = message.text || '';
const chatId = (message.chat?.id || '').toString();

const quotedMatch = text.match(/^\/status\s+"([^"]+)"/);
const simpleMatch = text.match(/^\/status\s+(\S+)/);

let subjectKeyword;

if (quotedMatch) {
  subjectKeyword = quotedMatch[1];
} else if (simpleMatch) {
  subjectKeyword = simpleMatch[1];
} else {
  return [{
    json: {
      chatId,
      parse_mode: "HTML",
      text: '⚠️ 格式錯誤。請使用：\n<code>/status 文章關鍵字</code>\n\n範例：\n<code>/status Foundry</code>\n<code>/status "測試 n8n"</code>'
    }
  }];
}

return [{
  json: {
    chatId,
    subjectKeyword
  }
}];
