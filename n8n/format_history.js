// Node: Format History
// Description: Reads Google Sheets history and formats it for AI prompt
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Settings: "Always Output Data" = ON

// Handle empty sheet (no history yet)
let rows = [];
try {
  rows = $input.all().map(item => item.json);
} catch (e) {
  rows = [];
}

const recent = rows.slice(-20);

let historyText = '目前沒有歷史分配紀錄。';
let workloadSummary = '無紀錄';

if (recent.length > 0 && recent[0].Date) {
  historyText = recent.map(row =>
    `- ${row.Date || ''} | ${row.Subject || ''} | Reviewer: ${row.Reviewer1 || ''}, ${row.Reviewer2 || ''}`
  ).join('\n');

  const reviewerCounts = {};
  recent.forEach(row => {
    [row.Reviewer1, row.Reviewer2].forEach(name => {
      if (name) {
        reviewerCounts[name] = (reviewerCounts[name] || 0) + 1;
      }
    });
  });
  workloadSummary = Object.entries(reviewerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name}: ${count} 次`)
    .join(', ') || '無紀錄';
}

// Get data from earlier nodes (use .first() for "Run Once for All Items" mode)
let subject = '', articleUrl = '', emailBody = '', senderName = '', senderEmail = '', emailId = '';
try {
  const info = $('Check Duplicate').first().json;
  subject = info.subject || '';
  articleUrl = info.articleUrl || '';
  emailBody = info.emailBody || '';
  senderName = info.senderName || '';
  senderEmail = info.senderEmail || '';
  emailId = info.emailId || '';
} catch (e) {}

let articleContent = '無法取得文章內容（連結可能需要登入）';
try {
  const fetchData = $('Fetch Article').first().json;
  if (fetchData && fetchData.data) {
    articleContent = fetchData.data.substring(0, 3000);
  }
} catch (e) {}

// IMPORTANT: Always return at least one item
return [{
  json: {
    historyText,
    workloadSummary,
    emailId,
    subject,
    articleUrl,
    emailBody,
    senderName,
    senderEmail,
    articleContent
  }
}];
