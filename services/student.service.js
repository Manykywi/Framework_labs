import { REDIS_KEYS } from '../constants/redisKeys.js';

export class StudentService {
  constructor(repo, redis) {
    this.repo = repo;
    this.redis = redis;
  }

  async getAllStudents(course) {
    return this.repo.findAll(course);
  }

  async getStudentsPaginated(course, page = 1, limit = 10) {
    const cacheKey = REDIS_KEYS.studentsPaginated(page, limit, course);
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) return JSON.parse(cached);

    const [data, total] = await Promise.all([
      this.repo.findPaginated(course, page, limit),
      this.repo.count(course),
    ]);
    const totalPages = Math.ceil(total / limit);
    const result = { data, meta: { total, page, limit, totalPages } };
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 86400);
    return result;
  }

  async createStudent(data) {
    const result = await this.repo.create(data);
    await this._invalidateCache();
    return result;
  }

  async updateStudent(id, updates) {
    const result = await this.repo.update(id, updates);
    if (result) await this._invalidateCache();
    return result;
  }

  async deleteStudent(id) {
    const removed = await this.repo.remove(id);
    if (removed) await this._invalidateCache();
    return removed;
  }

  async getStudentById(id) {
    return this.repo.findById(id);
  }

  async _invalidateCache() {
    const keys = await this.redis.keys(REDIS_KEYS.studentsV2Pattern);
    if (keys.length > 0) await this.redis.del(...keys);
  }
}
