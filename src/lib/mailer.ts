import createTransport from "nodemailer";

type BaseMailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type MailTransporter = ReturnType<typeof createTransport> | null;

let transporter: MailTransporter = null;

const resolveTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port) {
    console.warn(
      "[MAILER] SMTP configuration missing – mails will be logged instead of sent.",
    );
    transporter = null;
    return transporter;
  }

  transporter = createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
};

const getMailFrom = () => process.env.SUPPORT_MAIL_FROM || "no-reply@phenohub.app";

export const sendMail = async (params: BaseMailParams) => {
  const resolvedTransporter = resolveTransporter();

  if (!resolvedTransporter) {
    console.info("[MAILER:FALLBACK]", {
      to: params.to,
      subject: params.subject,
      preview: params.text,
    });
    return;
  }

  await resolvedTransporter.sendMail({
    from: getMailFrom(),
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
};

const buildConfirmationContent = (email: string) => {
  const subject = "Danke für dein Interesse an PhenoHub Support";
  const text = [
    "Hey 👋",
    "",
    "Danke, dass du dich für die PhenoHub Supporter-Liste eingetragen hast.",
    "Wir melden uns bei dir, sobald das 4 €-Monatsabo live ist und halten dich über neue Features auf dem Laufenden.",
    "",
    "Bis bald und happy growing! 🌱",
    "",
    "— Dein PhenoHub Team",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2933;">
      <p>Hey 👋</p>
      <p>Danke, dass du dich für die PhenoHub Supporter-Liste eingetragen hast.</p>
      <p>Wir melden uns bei dir, sobald das 4 €-Monatsabo live ist und halten dich über neue Features auf dem Laufenden.</p>
      <p>Bis bald und happy growing! 🌱</p>
      <p>— Dein PhenoHub Team</p>
    </div>
  `;

  return { subject, text, html, email };
};

export const sendSupporterConfirmationMail = async (email: string) => {
  const payload = buildConfirmationContent(email);
  await sendMail({
    to: email,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
};

export const sendSupporterNotificationMail = async (email: string) => {
  const notificationRecipient = process.env.SUPPORT_NOTIFICATION_EMAIL;
  if (!notificationRecipient) {
    return;
  }

  await sendMail({
    to: notificationRecipient,
    subject: "Neuer Supporter-Eintrag",
    text: `Neue Supporter-Anmeldung:\n\nE-Mail: ${email}\nZeitpunkt: ${new Date().toISOString()}`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2933;">
      <p><strong>Neue Supporter-Anmeldung</strong></p>
      <p><strong>E-Mail:</strong> ${email}</p>
      <p><strong>Zeitpunkt:</strong> ${new Date().toISOString()}</p>
    </div>`,
  });
};
