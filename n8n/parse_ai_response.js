// Node: Parse AI Response
// Description: Parses the structured JSON from the AI API response
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items

const aiResponse = $input.first().json;

// For OpenAI:
const content = aiResponse.choices?.[0]?.message?.content || '';
// For Claude, use instead:
// const content = aiResponse.content?.[0]?.text || '';

// Parse JSON (handle potential markdown fences)
const cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

let parsed;
try {
  parsed = JSON.parse(cleanJson);
} catch (e) {
  // Fallback if AI didn't return valid JSON
  parsed = {
    reviewer1: 'PARSE_ERROR',
    reviewer2: 'PARSE_ERROR',
    category: 'Unknown',
    reason_zh: `AI 回覆解析失敗，請人工分配。原始回覆：${content.substring(0, 200)}`
  };
}

const formatHistory = $('Format History').first().json;

return [{
  json: {
    reviewer1: parsed.reviewer1,
    reviewer2: parsed.reviewer2,
    category: parsed.category,
    reason: parsed.reason_zh,
    subject: formatHistory.subject,
    articleUrl: formatHistory.articleUrl,
    senderName: formatHistory.senderName,
    senderEmail: formatHistory.senderEmail,
    emailId: formatHistory.emailId || '',
    date: new Date().toISOString().split('T')[0]
  }
}];
