import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async verifyEmail(token: string, email: string) {
    try {
      Logger.debug('[Notification SV] sending verification email', email);

      const host = this.configService.get<string>('NOTIFICATION_URL');
      const verificationUrl = `${host}/api/auth/verify-email?token=${token}&email=${email}`;

      await this.mailerService.sendMail({
        to: email,
        subject: `${this.configService.get<string>('APP_NAME') || 'SELF HOSTED'} - Verify your email address`,
        template: 'register-verify',
        context: {
          verificationUrl,
          name: email.split('@')[0],
          url: verificationUrl,
          appName: this.configService.get<string>('APP_NAME') || 'SELF HOSTED',
        },
      });

      Logger.log('[Notification SV] verification email sent');
    } catch (error) {
      Logger.error(
        '[Notification SV] failed sending verification email',
        error,
      );

      throw new Error('Failed to send verification email');
    }
  }
}
