const studentController = require("#controllers/student.controller");

function handleStudentRoutes(req, res, pathname, parsedUrl) {
  if (req.method === "GET" && pathname === "/students") {
    studentController.getStudents(req, res, parsedUrl);
    return true;
  }

  if (req.method === "POST" && pathname === "/students") {
    studentController.createStudent(req, res);
    return true;
  }

  if (pathname.startsWith("/students/")) {
    const idRaw = pathname.split("/")[2];
    const id = Number.parseInt(idRaw, 10);

    if (req.method === "PATCH") {
      studentController.updateStudent(req, res, id);
      return true;
    }

    if (req.method === "DELETE") {
      studentController.deleteStudent(req, res, id);
      return true;
    }
  }

  return false;
}

module.exports = handleStudentRoutes;
