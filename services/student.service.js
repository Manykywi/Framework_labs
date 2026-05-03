import studentRepository from '../src/repositories/student.repository.js';

async function getAllStudents(course) {
  let students = await studentRepository.findAll();
  if (course) {
    students = students.filter((s) => String(s.course) === String(course));
  }
  return students;
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

export default { getAllStudents, createStudent, updateStudent, deleteStudent, getStudentById };
