// Node: Build Status Reply
// Description: Builds the status reply showing current reviewer assignments
//              and their acceptance status. Infers actual reviewers from status fields.
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this AFTER "Read for Status Query" (Google Sheets Read)

const d = $('Parse Status Command').first().json;
const rows = $input.all().map(item => item.json);

const matches = rows.filter(row =>
  row.Subject && row.Subject.toLowerCase().includes(d.subjectKeyword.toLowerCase())
);

if (matches.length === 0) {
  return [{
    json: {
      chat_id: d.chatId,
      parse_mode: "HTML",
      text: '⚠️ 找不到包含「' + d.subjectKeyword + '」的投稿紀錄。'
    }
  }];
}

const row = matches[matches.length - 1];

// Determine actual reviewers from status
function getActualReviewer(reviewerName, status) {
  const onBehalfMatch = (status || '').match(/✅\s+(\S+)\s+\(代/);
  if (onBehalfMatch) {
    return onBehalfMatch[1];
  }
  return reviewerName;
}

function formatReviewerLine(num, reviewerName, status) {
  const actual = getActualReviewer(reviewerName, status);
  const emoji = num === 1 ? '1️⃣' : '2️⃣';

  let line = emoji + ' @' + actual;
  if (actual !== reviewerName) {
    line += ' (代 @' + reviewerName + ')';
  }

  if (!status) {
    line += ' — ⏳ 待確認';
  } else if (status.startsWith('✅')) {
    line += ' — ✅ 已接受';
  } else if (status.includes('🔄')) {
    line += ' — 🔄 已重新分配';
  } else {
    line += ' — ' + status;
  }

  return line;
}

const r1Line = formatReviewerLine(1, row.Reviewer1, row.Reviewer1Status);
const r2Line = formatReviewerLine(2, row.Reviewer2, row.Reviewer2Status);

return [{
  json: {
    chat_id: d.chatId,
    parse_mode: "HTML",
    text: '📋 <b>投稿狀態</b>\n\n'
      + '<b>文章：</b>' + row.Subject + '\n'
      + '<b>分類：</b>' + (row.Category || 'N/A') + '\n'
      + '<b>投稿者：</b> ' + (row.Sender || 'N/A') + '\n'
      + '<b>日期：</b>' + (row.Date || 'N/A') + '\n\n'
      + '<b>Reviewer：</b>\n'
      + r1Line + '\n'
      + r2Line
  }
}];
