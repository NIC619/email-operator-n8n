// Node: Update Status Row
// Description: Prepares the status update for Google Sheets after a valid acceptance.
//              Uses isReviewer1 and currentRow from Validate Acceptance.
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this AFTER "Build Confirmation" and BEFORE "Write Status"

const d = $('Validate Acceptance').first().json;
const row = d.currentRow;

const statusValue = d.clickerUsername === d.reviewerName
  ? '✅ Accepted'
  : '✅ ' + d.clickerUsername + ' (代 ' + d.reviewerName + ')';

return [{
  json: {
    Date: row.Date,
    Subject: row.Subject,
    Reviewer1: row.Reviewer1,
    Reviewer2: row.Reviewer2,
    Category: row.Category,
    Sender: row.Sender,
    ArticleUrl: row.ArticleUrl,
    EmailId: row.EmailId,
    Reviewer1Status: d.isReviewer1 ? statusValue : (row.Reviewer1Status || ''),
    Reviewer2Status: !d.isReviewer1 ? statusValue : (row.Reviewer2Status || '')
  }
}];
