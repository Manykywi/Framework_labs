const studentService = require("#services/student.service");
const HTTP = require("#constants/httpStatus");

function getStudents(req, res, parsedUrl) {
  const course = parsedUrl.searchParams.get("course");

  const results = studentService.getAllStudents(course);

  res.statusCode = HTTP.OK;
  res.end(JSON.stringify({ count: results.length, items: results }));
}

module.exports = {
  getStudents
};