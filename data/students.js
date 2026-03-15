let STUDENTS = [{ id: 1, name: 'Ivan', grades: [5, 4, 5], course: 2 }];

export const getStudents = () => STUDENTS;
export const setStudents = (students) => {
  STUDENTS = students;
};
