import { IncomingWebhook } from '@slack/webhook'

const webhook = process.env.SLACK_WEBHOOK_URL
  ? new IncomingWebhook(process.env.SLACK_WEBHOOK_URL)
  : null

export const notifySlack = async (err, req) => {
  if (!webhook) return
  try {
    await webhook.send({
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
    })
  } catch (slackErr) {
    console.error('❌ [Slack] Failed to send notification:', slackErr.message)
  }
}

export const sendSlackNotification = async (message) => {
  if (!webhook) return
  try {
    await webhook.send({ text: message })
  } catch (err) {
    console.error('❌ [Slack] Failed to send notification:', err.message)
  }
}
