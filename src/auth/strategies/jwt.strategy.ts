import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: fs.readFileSync(
        configService.get<string>('JWT_PUBLIC') || '',
      ),
      algorithms: ['RS256'],
      issuer: configService.get<string>('JWT_ISSUER'),
      audience: (configService.get<string>('JWT_AUDIENCE') || '').split(','),
    });
  }

  validate(payload: any) {
    return {
      persona: payload.sub,
      email: payload.email,
      additionalData: payload.additionalData,
    };
  }
}
