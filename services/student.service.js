import studentRepository from '../src/repositories/student.repository.js';

async function getAllStudents(course) {
  let students = await studentRepository.findAll();
  if (course) {
    students = students.filter((s) => String(s.course) === String(course));
  }
  return students;
}

async function getStudentsPaginated(course, page = 1, limit = 10) {
  let students = await studentRepository.findAll();
  if (course) {
    students = students.filter((s) => String(s.course) === String(course));
  }
  const total = students.length;
  const totalPages = Math.ceil(total / limit);
  const data = students.slice((page - 1) * limit, page * limit);
  return { data, meta: { total, page, limit, totalPages } };
}

async function createStudent(data) {
  return studentRepository.create(data);
}

async function updateStudent(id, updates) {
  return studentRepository.update(id, updates);
}

async function deleteStudent(id) {
  return studentRepository.remove(id);
}

async function getStudentById(id) {
  return studentRepository.findById(id);
}

export default {
  getAllStudents,
  getStudentsPaginated,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentById,
};
