export const notifySlack = async (err, req) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  try {
    const body = {
      text: '🚨 Error 5XX en BildyApp',
      attachments: [
        {
          color: 'danger',
          fields: [
            { title: 'Timestamp', value: new Date().toISOString(), short: true },
            { title: 'Method', value: req.method, short: true },
            { title: 'Path', value: req.originalUrl, short: true },
            { title: 'Error', value: err.message || 'Unknown error', short: false },
            { title: 'Stack', value: `\`\`\`${err.stack || ''}\`\`\``, short: false }
          ]
        }
      ]
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch (slackErr) {
    console.error('❌ [Slack] Failed to send notification:', slackErr.message)
  }
}
