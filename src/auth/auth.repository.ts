import { Inject, Injectable, Logger } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import { CONNECTION } from '../constants';
import { SessionDto } from './dto/return-value.dto';

@Injectable()
export class AuthRepository {
  private readonly collection: Collection;

  constructor(@Inject(CONNECTION) private db: Db) {
    this.collection = this.db.collection('sessions');
  }

  findOneByToken(hashRefreshToken: string) {
    Logger.debug('[AUTH REP] Finding session by token');

    return this.collection.findOne({ hashRefreshToken });
  }

  findByPersona(persona: string) {
    Logger.debug('[AUTH REP] Finding session by persona');

    return this.collection.findOne({ persona });
  }

  upsert(token: SessionDto) {
    Logger.debug('[AUTH REP] Upserting session');

    const filter = { hashDeviceId: token.hashDeviceId };
    const payload = {
      $set: {
        ...token,
        modifiedAt: new Date(),
        expiredAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      $setOnInsert: { createdAt: new Date() },
    };

    return this.collection.findOneAndUpdate(filter, payload, {
      upsert: true,
      returnDocument: 'after',
    });
  }
}
