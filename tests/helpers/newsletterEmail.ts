import request from 'supertest';

type CapturedEmail = { to: string; subject: string; text: string };
export const newsletterEmails: CapturedEmail[] = [];

export function captureTransactionalEmail(email: CapturedEmail) {
  newsletterEmails.push(email);
}

export async function confirmNewsletter(app: Parameters<typeof request>[0], email: string) {
  const message = [...newsletterEmails].reverse().find(item => item.to === email.toLowerCase());
  const confirmationUrl = message?.text.match(/https?:\/\/[^\s]+/)?.[0];
  if (!confirmationUrl) throw new Error(`No confirmation email was captured for ${email}`);
  const url = new URL(confirmationUrl);
  const token = url.searchParams.get('token');
  if (!token) throw new Error('Captured newsletter confirmation email did not contain a token');

  await request(app).get(`${url.pathname}${url.search}`).expect(200);
  const confirmation = await request(app).post('/api/newsletter/confirm').type('form').send({ token }).expect(200);
  const unsubscribeHref = confirmation.text.match(/href="([^"]*newsletter\/unsubscribe[^"]*)"/)?.[1];
  return { token, unsubscribeUrl: unsubscribeHref ? unsubscribeHref.replaceAll('&amp;', '&') : null };
}
