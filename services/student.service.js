import { getStudents, setStudents } from '#data/students';

function getAllStudents(course) {
  let students = [...getStudents()];

  if (course) {
    students = students.filter((s) => String(s.course) === String(course));
  }

  return students;
}

function createStudent(data) {
  const students = getStudents();

  const lastId = students.length ? students[students.length - 1].id : 0;

  const newStudent = {
    id: lastId + 1,
    ...data,
  };

  students.push(newStudent);

  return newStudent;
}

function updateStudent(id, updates) {
  const students = getStudents();

  const index = students.findIndex((s) => s.id === id);

  if (index === -1) return null;

  students[index] = { ...students[index], ...updates };

  return students[index];
}

function deleteStudent(id) {
  const students = getStudents();

  const newStudents = students.filter((s) => s.id !== id);

  if (newStudents.length === students.length) return false;

  setStudents(newStudents);

  return true;
}

export default {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
