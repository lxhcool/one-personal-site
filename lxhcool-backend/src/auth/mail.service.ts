import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { requireEnv } from '../config/env';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationCode(email: string, code: string) {
    const apiKey = requireEnv('RESEND_API_KEY');
    const from = requireEnv('MAIL_FROM');

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: '你的注册验证码',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>注册验证码</h2>
          <p>你的验证码是：</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
          <p>验证码 10 分钟内有效。如果不是你本人操作，请忽略这封邮件。</p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }
}
