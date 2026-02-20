// Node: Find and Reassign
// Description: Finds the matching article row by subject keyword and prepares
//              the reassignment data. Returns a reply message for all cases
//              (success, not found, reviewer not found).
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this AFTER "Read for Reassign" (Google Sheets Read)

const d = $('Parse Reassign Command').first().json;
const rows = $input.all().map(item => item.json);

const matches = rows.filter(row =>
  row.Subject && row.Subject.toLowerCase().includes(d.subjectKeyword.toLowerCase())
);

if (matches.length === 0) {
  return [{
    json: {
      shouldUpdate: false,
      chatId: d.chatId,
      parse_mode: "HTML",
      text: '⚠️ 找不到包含「' + d.subjectKeyword + '」的投稿紀錄。'
    }
  }];
}

// Use the most recent match
const row = matches[matches.length - 1];
let updatedRow = { ...row };
let found = false;

if (row.Reviewer1 === d.oldReviewer) {
  updatedRow.Reviewer1 = d.newReviewer;
  updatedRow.Reviewer1Status = '🔄 Reassigned by @' + d.fromUsername;
  found = true;
} else if (row.Reviewer2 === d.oldReviewer) {
  updatedRow.Reviewer2 = d.newReviewer;
  updatedRow.Reviewer2Status = '🔄 Reassigned by @' + d.fromUsername;
  found = true;
}

if (!found) {
  return [{
    json: {
      shouldUpdate: false,
      chatId: d.chatId,
      parse_mode: "HTML",
      text: '⚠️ 在「' + row.Subject + '」中找不到 Reviewer @' + d.oldReviewer + '。\n目前的 Reviewer 為：@' + row.Reviewer1 + '、@' + row.Reviewer2
    }
  }];
}

return [{
  json: {
    shouldUpdate: true,
    chatId: d.chatId,
    parse_mode: "HTML",
    text: '🔄 <b>Reviewer 已重新分配</b>\n\n'
      + '<b>文章：</b>' + row.Subject + '\n'
      + '<b>變更：</b>@' + d.oldReviewer + ' → @' + d.newReviewer + '\n'
      + '<b>操作者：</b>@' + d.fromUsername,
    updatedRow
  }
}];
