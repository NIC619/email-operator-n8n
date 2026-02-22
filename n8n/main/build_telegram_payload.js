// Node: Build Telegram Payload
// Description: Builds the Telegram notification message with inline keyboard buttons
//              for reviewer confirmation. Callback data includes slot (r1/r2) for
//              accurate identification after reassignment.
// n8n Node Type: Code (JavaScript), Mode: Run Once for All Items
// Workflow: Main workflow
// Place this AFTER "Parse AI Response" and BEFORE "Send Telegram Notification"
//
// IMPORTANT: Update chat_id to your Telegram group chat ID when going live
//
// Callback data format: accept_<slot>_<reviewerName>_<emailId>
// Example: accept_r1_sc0vu_19c7988a7950517f

const d = $input.first().json;

return [{
  json: {
    chat_id: "YOUR_GROUP_CHAT_ID",
    parse_mode: "HTML",
    text: [
      "📝 <b>新投稿通知</b>",
      "",
      "<b>主題：</b>",
      d.subject,
      "",
      "<b>投稿者：</b>",
      d.senderName + " (" + d.senderEmail + ")",
      "",
      "<b>文章連結：</b>",
      d.articleUrl,
      "",
      "<b>分類：</b>" + d.category,
      "",
      "<b>指派 Reviewer：</b>",
      "1️⃣ @" + d.reviewer1,
      "2️⃣ @" + d.reviewer2,
      "",
      "<b>原因：</b>",
      d.reason,
      "",
      "請點擊下方按鈕接受審稿（本人或可代為接受）："
    ].join("\n"),
    reply_markup: {
      inline_keyboard: [
        [
          {text: "✅ 接受 " + d.reviewer1 + " 的審稿任務", callback_data: "accept_r1_" + d.reviewer1 + "_" + d.emailId}
        ],
        [
          {text: "✅ 接受 " + d.reviewer2 + " 的審稿任務", callback_data: "accept_r2_" + d.reviewer2 + "_" + d.emailId}
        ]
      ]
    }
  }
}];
