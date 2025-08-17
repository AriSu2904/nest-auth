import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import { CONNECTION } from '../constants';
import * as process from 'node:process';

export const dbProvider = {
  provide: CONNECTION,
  useFactory: async (): Promise<Db> => {
    const encodePassword = encodeURIComponent(process.env.DB_PASSWORD || '');
    const username = process.env.DB_USERNAME || '';
    const uri = process.env.DB_URI || '';
    const client = new MongoClient(
      `mongodb+srv://${username}:${encodePassword}@${uri}`,
      {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      },
    );
    await client.connect();
    return client.db(process.env.DB_NAME);
  },
};
