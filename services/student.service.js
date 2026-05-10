export class StudentService {
  constructor(repo) {
    this.repo = repo;
  }

  async getAllStudents(course) {
    return this.repo.findAll(course);
  }

  async getStudentsPaginated(course, page = 1, limit = 10) {
    const [data, total] = await Promise.all([
      this.repo.findPaginated(course, page, limit),
      this.repo.count(course),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  async createStudent(data) {
    return this.repo.create(data);
  }

  async updateStudent(id, updates) {
    return this.repo.update(id, updates);
  }

  async deleteStudent(id) {
    return this.repo.remove(id);
  }

  async getStudentById(id) {
    return this.repo.findById(id);
  }
}
