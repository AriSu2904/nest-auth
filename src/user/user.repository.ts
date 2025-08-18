import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db, Document, WithId, WithoutId } from 'mongodb';
import { CONNECTION } from '../constants';

@Injectable()
export class UserRepository {
  private readonly collection: Collection;

  constructor(@Inject(CONNECTION) private db: Db) {
    this.collection = this.db.collection('users');
  }

  create(user: WithoutId<Document>) {
    return this.collection.insertOne(user);
  }

  findByPersona(persona: string): Promise<WithId<Document>> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.collection.findOne({ persona });
  }

  findByParam(param: string): Promise<WithId<Document>> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.collection.findOne({
      $or: [{ persona: param }, { email: param }],
    });
  }

  async updateUser(user: WithId<Document>): Promise<WithId<Document> | null> {
    const filter = { _id: user._id };
    const payload = { $set: { ...user } };

    return this.collection.findOneAndUpdate(filter, payload, {
      returnDocument: 'after',
      projection: { password: 0, _id: 0 },
    });
  }
}
