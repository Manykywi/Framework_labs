require("dotenv").config();

const { createServer } = require("node:http");
const config = require("./config/config");
const handleStudentRoutes = require("./routes/student.routes");

const server = createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (handleStudentRoutes(req, res, pathname, parsedUrl)) {
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(`Server running at http://${config.HOSTNAME}:${config.PORT}/`);
});