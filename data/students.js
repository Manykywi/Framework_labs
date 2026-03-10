let STUDENTS = [{ id: 1, name: 'Ivan', grades: [5, 4, 5], course: 2 }];

export function getStudents() {
  return STUDENTS;
}

export function setStudents(students) {
  STUDENTS = students;
}
