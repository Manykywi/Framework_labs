import studentService from '#services/student.service';
import HTTP from '#constants/httpStatus';
import ERROR_MESSAGES from '#constants/errorMessages';

function getStudents(request, reply) {
  const course = request.query?.course;

  const results = studentService.getAllStudents(course);

  reply.code(HTTP.OK).send({ count: results.length, items: results });
}

function createStudent(request, reply) {
  const data = request.body;

  const student = studentService.createStudent({
    name: data.name,
    course: data.course,
    grades: data.grades,
  });

  return reply.code(HTTP.CREATED).send({ message: 'Created', student });
}

function updateStudent(request, reply) {
  const { id } = request.params;
  const updates = request.body;

  const student = studentService.updateStudent(id, updates);

  if (!student) {
    return reply.notFound(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  return reply.code(HTTP.OK).send({ message: 'Updated', student });
}

function deleteStudent(request, reply) {
  const { id } = request.params;
  const removed = studentService.deleteStudent(id);

  if (!removed) {
    return reply.notFound(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  return reply.code(HTTP.OK).send({ message: 'Student removed' });
}

export default {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
