// Node: Find and Reassign
// Description: Finds the matching article row by subject keyword and prepares
//              the reassignment data. Infers actual reviewers from status fields:
//              - "✅ xxx (代 yyy)" → actual person is xxx
//              - "✅ Accepted" → actual person is the Reviewer column value
//              - "🔄 Reassigned" → actual person is the Reviewer column value (already updated)
//              - empty → actual person is the Reviewer column value
//              Only the actual current reviewer can be reassigned.
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

// Determine who is actually responsible for each slot right now
function getActualReviewer(reviewerName, status) {
  const onBehalfMatch = (status || '').match(/✅\s+(\S+)\s+\(代/);
  if (onBehalfMatch) {
    return onBehalfMatch[1];
  }
  return reviewerName;
}

const actualReviewer1 = getActualReviewer(row.Reviewer1, row.Reviewer1Status);
const actualReviewer2 = getActualReviewer(row.Reviewer2, row.Reviewer2Status);

// Only match against the ACTUAL current reviewer, not the column value
if (actualReviewer1 === d.oldReviewer) {
  updatedRow.Reviewer1 = d.newReviewer;
  updatedRow.Reviewer1Status = '🔄 Reassigned by @' + d.fromUsername
    + ' (' + d.oldReviewer + ' → ' + d.newReviewer + ')';
  found = true;
} else if (actualReviewer2 === d.oldReviewer) {
  updatedRow.Reviewer2 = d.newReviewer;
  updatedRow.Reviewer2Status = '🔄 Reassigned by @' + d.fromUsername
    + ' (' + d.oldReviewer + ' → ' + d.newReviewer + ')';
  found = true;
}

if (!found) {
  return [{
    json: {
      shouldUpdate: false,
      chatId: d.chatId,
      parse_mode: "HTML",
      text: '⚠️ 在「' + row.Subject + '」中找不到實際負責的 Reviewer @' + d.oldReviewer + '。\n\n'
        + '目前實際負責的 Reviewer：\n'
        + '1️⃣ @' + actualReviewer1 + (actualReviewer1 !== row.Reviewer1 ? ' (代 @' + row.Reviewer1 + ')' : '') + '\n'
        + '2️⃣ @' + actualReviewer2 + (actualReviewer2 !== row.Reviewer2 ? ' (代 @' + row.Reviewer2 + ')' : '')
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
