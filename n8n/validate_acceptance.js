// Node: Validate Acceptance
// Description: Checks if the reviewer slot is still available for acceptance.
//              Uses slot (r1/r2) from callback data for accurate identification,
//              even after reassignment changes the Reviewer column values.
//              Aborts if someone already accepted or if the reviewer was reassigned.
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this AFTER "Read Log for Validation" and BEFORE "Is Valid Acceptance" (If node)

const d = $('Parse Callback').first().json;
const rows = $input.all().map(item => item.json);

// Find the row matching this emailId
const row = rows.find(r => r.EmailId === d.emailId);

if (!row) {
  return [{
    json: {
      valid: false,
      chatId: d.chatId,
      parse_mode: "HTML",
      text: '⚠️ 找不到此投稿紀錄，可能已被刪除。'
    }
  }];
}

// Use slot directly from callback data — no name matching needed
const isReviewer1 = d.slot === 'r1';
const status = isReviewer1 ? (row.Reviewer1Status || '') : (row.Reviewer2Status || '');
const currentReviewer = isReviewer1 ? row.Reviewer1 : row.Reviewer2;

// Check if already accepted
if (status.startsWith('✅')) {
  return [{
    json: {
      valid: false,
      chatId: d.chatId,
      parse_mode: "HTML",
      text: '⚠️ @' + d.reviewerName + ' 的審稿任務已被接受，無法再由 @' + d.clickerUsername + ' 代為接受。'
    }
  }];
}

// Check if reassigned
if (status.includes('🔄') || status.includes('Reassigned')) {
  return [{
    json: {
      valid: false,
      chatId: d.chatId,
      parse_mode: "HTML",
      text: '⚠️ @' + d.reviewerName + ' 的審稿任務已重新分配給 @' + currentReviewer + '，無法再由 @' + d.clickerUsername + ' 代為接受。'
    }
  }];
}

// Also check if the reviewer name no longer matches (edge case)
if (d.reviewerName !== currentReviewer) {
  return [{
    json: {
      valid: false,
      chatId: d.chatId,
      parse_mode: "HTML",
      text: '⚠️ @' + d.reviewerName + ' 已不在此投稿的 Reviewer 名單中。\n\n'
        + '目前的 Reviewer：\n'
        + '1️⃣ @' + row.Reviewer1 + '\n'
        + '2️⃣ @' + row.Reviewer2
    }
  }];
}

// All good — pass through for acceptance
return [{
  json: {
    valid: true,
    ...d,
    isReviewer1,
    currentRow: row
  }
}];
