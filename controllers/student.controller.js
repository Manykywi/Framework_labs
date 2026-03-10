import * as studentService from '#services/student.service';
import * as HTTP from '#constants/httpStatus';

function getStudents(req, res, parsedUrl) {
  const course = parsedUrl.searchParams.get('course');

  const results = studentService.getAllStudents(course);

  res.statusCode = HTTP.OK;
  res.end(JSON.stringify({ count: results.length, items: results }));
}

export { getStudents };
