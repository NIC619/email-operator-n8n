// Node: Check Duplicate
// Description: Checks if this email has already been processed by comparing
//              the email ID against the Google Sheet log
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Settings: "Always Output Data" = OFF (important — empty return stops the chain)
// Place this AFTER "Read Log for Dedup" and BEFORE "Fetch Article"
//
// Prerequisites:
// - Add a column "EmailId" to your Google Sheet (column H)
// - Add a Google Sheets Read node before this named "Read Log for Dedup"
//   with "Always Output Data" = ON

const emailId = $('Gmail Trigger').first().json.id || '';

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
  return [];
}

// Not a duplicate — pass through all data plus the email ID
const info = $('Extract Info').first().json;
return [{
  json: {
    ...info,
    emailId: emailId
  }
}];
