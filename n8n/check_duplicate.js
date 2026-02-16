// Node: Check Duplicate
// Description: Checks if this email has already been processed by comparing
//              the email ID against the Google Sheet log
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Place this AFTER Extract Info and BEFORE Fetch Article
//
// Prerequisites:
// - Add a new column "EmailId" to your Google Sheet (column H)
// - Add a "Read Sheet" node before this to load existing records
// - Name that node "Read Log for Dedup"

const emailId = $('Gmail Trigger').item.json.id || '';
const subject = $('Extract Info').item.json.subject || '';

// Get existing email IDs from the sheet
let existingIds = [];
try {
  const rows = $('Read Log for Dedup').all().map(item => item.json);
  existingIds = rows.map(row => row.EmailId).filter(Boolean);
} catch (e) {
  // Sheet is empty or node didn't run, treat as no duplicates
  existingIds = [];
}

const isDuplicate = existingIds.includes(emailId);

if (isDuplicate) {
  // Return empty to stop the workflow for this item
  // (Make sure the next node does NOT have "Always Output Data" on)
  return [];
}

// Not a duplicate — pass through all data plus the email ID
return [{
  json: {
    ...$('Extract Info').item.json,
    emailId: emailId
  }
}];
