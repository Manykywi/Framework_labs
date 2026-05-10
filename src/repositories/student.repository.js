import { eq, count } from 'drizzle-orm';
import { students } from '../../db/schema.js';

export class StudentRepository {
  constructor(db) {
    this.db = db;
  }

  _parseRow(row) {
    return { ...row, grades: JSON.parse(row.grades) };
  }

  async findAll(course) {
    const query = this.db.select().from(students);
    const rows = course
      ? await query.where(eq(students.course, Number(course)))
      : await query;
    return rows.map((r) => this._parseRow(r));
  }

  async findById(id) {
    const rows = await this.db.select().from(students).where(eq(students.id, Number(id)));
    if (!rows[0]) return null;
    return this._parseRow(rows[0]);
  }

  async create(data) {
    const { name, course, grades = [], email, image = null } = data;
    const [result] = await this.db.insert(students).values({
      name,
      course: Number(course),
      grades: JSON.stringify(grades),
      email,
      image,
    });
    return { id: result.insertId, name, course: Number(course), grades, email, image };
  }

  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await this.db
      .update(students)
      .set({
        name: merged.name,
        course: merged.course,
        grades: JSON.stringify(merged.grades),
        email: merged.email,
        image: merged.image,
      })
      .where(eq(students.id, Number(id)));
    return merged;
  }

  async remove(id) {
    const [result] = await this.db.delete(students).where(eq(students.id, Number(id)));
    return result.affectedRows > 0;
  }

  async count(course) {
    const query = this.db.select({ total: count() }).from(students);
    const [{ total }] = course
      ? await query.where(eq(students.course, Number(course)))
      : await query;
    return total;
  }

  async findPaginated(course, page = 1, limit = 10) {
    const query = this.db.select().from(students);
    const rows = course
      ? await query.where(eq(students.course, Number(course))).limit(limit).offset((page - 1) * limit)
      : await query.limit(limit).offset((page - 1) * limit);
    return rows.map((r) => this._parseRow(r));
  }

  async *findAllStream() {
    const rows = await this.db.select().from(students);
    for (const row of rows) {
      yield this._parseRow(row);
    }
  }
}
