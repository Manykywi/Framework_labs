export class StudentRepository {
  constructor(db) {
    this.db = db;
  }

  _parseRow(row) {
    return { ...row, grades: JSON.parse(row.grades) };
  }

  async findAll(course) {
    let sql = 'SELECT * FROM students';
    const params = [];
    if (course) {
      sql += ' WHERE course = ?';
      params.push(Number(course));
    }
    sql += ' ORDER BY id';
    const [rows] = await this.db.execute(sql, params);
    return rows.map((r) => this._parseRow(r));
  }

  async findById(id) {
    const [rows] = await this.db.execute('SELECT * FROM students WHERE id = ?', [Number(id)]);
    if (!rows[0]) return null;
    return this._parseRow(rows[0]);
  }

  async create(data) {
    const { name, course, grades = [], email, image = null } = data;
    const [result] = await this.db.execute(
      'INSERT INTO students (name, course, grades, email, image) VALUES (?, ?, ?, ?, ?)',
      [name, Number(course), JSON.stringify(grades), email, image]
    );
    return { id: result.insertId, name, course: Number(course), grades, email, image };
  }

  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    await this.db.execute(
      'UPDATE students SET name=?, course=?, grades=?, email=?, image=? WHERE id=?',
      [merged.name, merged.course, JSON.stringify(merged.grades), merged.email, merged.image, Number(id)]
    );
    return merged;
  }

  async remove(id) {
    const [result] = await this.db.execute('DELETE FROM students WHERE id = ?', [Number(id)]);
    return result.affectedRows > 0;
  }

  async count(course) {
    let sql = 'SELECT COUNT(*) as total FROM students';
    const params = [];
    if (course) {
      sql += ' WHERE course = ?';
      params.push(Number(course));
    }
    const [rows] = await this.db.execute(sql, params);
    return rows[0].total;
  }

  async findPaginated(course, page = 1, limit = 10) {
    let sql = 'SELECT * FROM students';
    const params = [];
    if (course) {
      sql += ' WHERE course = ?';
      params.push(Number(course));
    }
    sql += ' ORDER BY id LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    const [rows] = await this.db.execute(sql, params);
    return rows.map((r) => this._parseRow(r));
  }

  async *findAllStream() {
    const [rows] = await this.db.execute('SELECT * FROM students ORDER BY id');
    for (const row of rows) {
      yield this._parseRow(row);
    }
  }
}
