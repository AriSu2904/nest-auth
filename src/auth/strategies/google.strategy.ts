import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserGoogleProfileDto } from '../dto/return-value.dto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GMAIL_CLIENT_ID'),
      clientSecret: configService.get<string>('GMAIL_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_OAUTH_CALLBACK'),
      scope: ['profile', 'email', 'openid'],
      accessType: 'offline',
      prompt: 'consent',
    } as any);

    this.client = new OAuth2Client({
      clientId: configService.get<string>('GMAIL_CLIENT_ID'),
      clientSecret: configService.get<string>('GMAIL_CLIENT_SECRET'),
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { name, emails, photos } = profile;
    const idToken = profile.id_token || profile._json.id_token;

    const user: UserGoogleProfileDto = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      refreshToken,
      idToken,
    };
    done(null, user);
  }
}
