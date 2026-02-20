// Node: Update Status Row
// Description: Finds the matching row by EmailId and prepares the status update
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: TEM Reviewer Bot - Callback Handler
// Place this AFTER "Read Log for Status" and BEFORE "Write Status"

const d = $('Parse Callback').first().json;
const rows = $input.all().map(item => item.json);

// Find the row matching this emailId
const rowIndex = rows.findIndex(row => row.EmailId === d.emailId);

if (rowIndex === -1) {
  return [{ json: { error: 'Row not found for emailId: ' + d.emailId } }];
}

const row = rows[rowIndex];

// Determine which column to update
const isReviewer1 = d.reviewerName === row.Reviewer1;
const statusField = isReviewer1 ? 'Reviewer1Status' : 'Reviewer2Status';

const statusValue = d.clickerUsername === d.reviewerName
  ? '✅ Accepted'
  : '✅ ' + d.clickerUsername + ' (代 ' + d.reviewerName + ')';

return [{
  json: {
    rowNumber: rowIndex + 2, // +1 for header, +1 for 0-index
    statusField,
    statusValue,
    // Pass full row data for the update
    Date: row.Date,
    Subject: row.Subject,
    Reviewer1: row.Reviewer1,
    Reviewer2: row.Reviewer2,
    Category: row.Category,
    Sender: row.Sender,
    ArticleUrl: row.ArticleUrl,
    EmailId: row.EmailId,
    Reviewer1Status: isReviewer1 ? statusValue : (row.Reviewer1Status || ''),
    Reviewer2Status: !isReviewer1 ? statusValue : (row.Reviewer2Status || '')
  }
}];
