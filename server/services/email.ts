export class EmailDeliveryUnavailable extends Error {
  constructor(message = 'Transactional email delivery is not configured.') {
    super(message);
    this.name = 'EmailDeliveryUnavailable';
  }
}

interface TransactionalEmail {
  to: string;
  subject: string;
  text: string;
}

export async function sendTransactionalEmail(email: TransactionalEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !sender) throw new EmailDeliveryUnavailable();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: sender, to: [email.to], subject: email.subject, text: email.text })
  });
  if (!response.ok) throw new Error('Transactional email provider rejected the message.');
}
