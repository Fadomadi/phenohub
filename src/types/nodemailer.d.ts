declare module "nodemailer" {
  export interface SendMailOptions {
    from?: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<void>;
    verify?(): Promise<void>;
  }

  export type TransportConfig = Record<string, unknown> | string;

  export default function createTransport(options: TransportConfig): Transporter;
}
