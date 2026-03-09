const studentController = require("#controllers/student.controller");

function handleStudentRoutes(req, res, pathname, parsedUrl) {
  if (req.method === "GET" && pathname === "/students") {
    studentController.getStudents(req, res, parsedUrl);
    return true;
  }

  return false;
}

module.exports = handleStudentRoutes;