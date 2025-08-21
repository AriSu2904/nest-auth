import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { google } from 'googleapis';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const clientId = configService.get<string>('GMAIL_CLIENT_ID') || '';
        const secretId = configService.get<string>('GMAIL_CLIENT_SECRET') || '';
        const redirectUrl =
          configService.get<string>('GMAIL_REDIRECT_URI') || '';

        const oauthClient2 = new google.auth.OAuth2(
          clientId,
          secretId,
          redirectUrl,
        );

        oauthClient2.setCredentials({
          refresh_token: configService.get<string>('GMAIL_REFRESH_TOKEN') || '',
        });

        return {
          transport: {
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: configService.get<string>('GMAIL_USER') || '',
              clientId,
              clientSecret: secretId,
              refreshToken:
                configService.get<string>('GMAIL_REFRESH_TOKEN') || '',
              accessToken:
                configService.get<string>('GMAIL_ACCESS_TOKEN') || '',
            },
          },
          defaults: {
            from: 'No Reply - arisusanto290401@gmail.com',
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
