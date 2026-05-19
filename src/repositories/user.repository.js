import { eq } from 'drizzle-orm';
import { users } from '../../db/schema.js';

export class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const rows = await this.db.select().from(users).where(eq(users.email, email));
    return rows[0] ?? null;
  }

  async create({ email, password }) {
    const [result] = await this.db.insert(users).values({ email, password });
    return { id: result.insertId, email };
  }
}
