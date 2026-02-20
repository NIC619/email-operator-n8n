// Node: Parse Reassign Command
// Description: Parses the /reassign command from Telegram message
//              Supports quoted subject keywords for multi-word subjects
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
//
// Command format:
//   /reassign <subject_keyword> <old_reviewer> <new_reviewer>
//   /reassign "<multi word keyword>" <old_reviewer> <new_reviewer>
//
// Examples:
//   /reassign Foundry sc0vu jerry9988
//   /reassign "測試 n8n" sc0vu jerry9988

const update = $input.first().json;
const message = update.message || {};
const text = message.text || '';
const chatId = (message.chat?.id || '').toString();
const fromUsername = message.from?.username || '';

if (!text.startsWith('/reassign')) {
  return [];
}

// Parse with support for quoted subject keyword
const quotedMatch = text.match(/^\/reassign\s+"([^"]+)"\s+(\S+)\s+(\S+)/);
const simpleMatch = text.match(/^\/reassign\s+(\S+)\s+(\S+)\s+(\S+)/);

let subjectKeyword, oldReviewer, newReviewer;

if (quotedMatch) {
  subjectKeyword = quotedMatch[1];
  oldReviewer = quotedMatch[2].replace('@', '');
  newReviewer = quotedMatch[3].replace('@', '');
} else if (simpleMatch) {
  subjectKeyword = simpleMatch[1];
  oldReviewer = simpleMatch[2].replace('@', '');
  newReviewer = simpleMatch[3].replace('@', '');
} else {
  return [{
    json: {
      parseError: true,
      chatId,
      text: '⚠️ 格式錯誤。請使用：\n<code>/reassign 文章關鍵字 原Reviewer 新Reviewer</code>\n\n範例：\n<code>/reassign Foundry sc0vu jerry9988</code>\n<code>/reassign "測試 n8n" sc0vu jerry9988</code>'
    }
  }];
}

return [{
  json: {
    parseError: false,
    chatId,
    fromUsername,
    subjectKeyword,
    oldReviewer,
    newReviewer
  }
}];
