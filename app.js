const { createServer } = require("node:http");

let STUDENTS = [
  { id: 1, name: "Ivan", grades: [5, 4, 5], course: 2 },
];

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // ===== GET: список студентів (+ фільтр по курсу)
  if (method === "GET" && pathname === "/students") {
    const course = parsedUrl.searchParams.get("course");

    let results = [...STUDENTS];

    if (course) {
      results = results.filter(
        (s) => String(s.course) === String(course)
      );
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ count: results.length, items: results }));
  }

  // ===== POST: додати студента
  if (method === "POST" && pathname === "/students") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        // валідація
        if (!data.name || !data.course || !Array.isArray(data.grades)) {
          res.statusCode = 400;
          return res.end(
            JSON.stringify({
              error: "name, course і grades (масив) обов'язкові",
            })
          );
        }

        const lastId =
          STUDENTS.length > 0 ? STUDENTS[STUDENTS.length - 1].id : 0;

        const newStudent = {
          id: lastId + 1,
          name: data.name,
          course: data.course,
          grades: data.grades,
        };

        STUDENTS.push(newStudent);

        res.statusCode = 201;
        res.end(JSON.stringify({ message: "Created", student: newStudent }));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // ===== PATCH: оновити студента
  if (method === "PATCH" && pathname.startsWith("/students/")) {
    const id = parseInt(pathname.split("/")[2]);

    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));

    req.on("end", () => {
      const index = STUDENTS.findIndex((s) => s.id === id);

      if (index === -1) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Student not found" }));
      }

      try {
        const updates = JSON.parse(body);

        if ("id" in updates) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Cannot change id" }));
        }

        STUDENTS[index] = { ...STUDENTS[index], ...updates };

        res.statusCode = 200;
        res.end(
          JSON.stringify({ message: "Updated", student: STUDENTS[index] })
        );
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  // ===== DELETE: видалити студента
  if (method === "DELETE" && pathname.startsWith("/students/")) {
    const id = parseInt(pathname.split("/")[2]);

    const originalLength = STUDENTS.length;
    STUDENTS = STUDENTS.filter((s) => s.id !== id);

    if (STUDENTS.length < originalLength) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ message: "Student removed" }));
    }

    res.statusCode = 404;
    return res.end(JSON.stringify({ error: "Student not found" }));
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});