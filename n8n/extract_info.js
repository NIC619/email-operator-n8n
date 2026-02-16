// Node: Extract Info
// Description: Extracts subject, article URL, and sender info from Gmail trigger output
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items

const raw = $input.first().json;
const text = raw.snippet || '';
const subject = raw.Subject || '';
const from = raw.From || '';

// Parse sender - format is either "name <email>" or just "email"
let senderEmail = from;
let senderName = '';
const nameEmailMatch = from.match(/^"?([^"<]*)"?\s*<(.+)>$/);
if (nameEmailMatch) {
  senderName = nameEmailMatch[1].trim();
  senderEmail = nameEmailMatch[2].trim();
}

// Find article draft links
const urlRegex = /https?:\/\/[^\s<>"')\]]+/g;
const allUrls = text.match(urlRegex) || [];

const articleUrls = allUrls.filter(url =>
  url.includes('medium.com') ||
  url.includes('hackmd.io') ||
  url.includes('docs.google.com') ||
  url.includes('notion.so')
);

return [{
  json: {
    subject: subject,
    articleUrl: articleUrls[0] || 'NO_LINK_FOUND',
    allUrls: articleUrls,
    emailBody: text,
    senderEmail: senderEmail,
    senderName: senderName || senderEmail
  }
}];
