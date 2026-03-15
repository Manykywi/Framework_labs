import studentService from '#services/student.service';
import HTTP from '#constants/httpStatus';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      if (!body) return resolve(null);

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function isValidStudentCreateBody(data) {
  if (!data || typeof data !== 'object') return false;

  const hasValidName = typeof data.name === 'string' && data.name.trim().length;
  const hasValidCourse = Number.isInteger(data.course) && data.course >= 1;
  const hasValidGrades =
    Array.isArray(data.grades) && data.grades.every((g) => typeof g === 'number');

  return Boolean(hasValidName && hasValidCourse && hasValidGrades);
}

function isValidStudentPatchBody(updates) {
  if (!updates || typeof updates !== 'object') return false;
  if (Array.isArray(updates)) return false;

  if ('name' in updates) {
    if (typeof updates.name !== 'string' || !updates.name.trim().length) {
      return false;
    }
  }

  if ('course' in updates) {
    if (!Number.isInteger(updates.course) || updates.course < 1) {
      return false;
    }
  }

  if ('grades' in updates) {
    if (!Array.isArray(updates.grades) || !updates.grades.every((g) => typeof g === 'number')) {
      return false;
    }
  }

  return true;
}

function getStudents(req, res, parsedUrl) {
  const course = parsedUrl.searchParams.get('course');

  const results = studentService.getAllStudents(course);

  res.statusCode = HTTP.OK;
  res.end(JSON.stringify({ count: results.length, items: results }));
}

async function createStudent(req, res) {
  try {
    const data = await readJsonBody(req);

    if (!isValidStudentCreateBody(data)) {
      res.statusCode = HTTP.BAD_REQUEST;
      return res.end(JSON.stringify({ error: 'name, course and grades (array) are required' }));
    }

    const student = studentService.createStudent({
      name: data.name,
      course: data.course,
      grades: data.grades,
    });

    res.statusCode = HTTP.CREATED;
    return res.end(JSON.stringify({ message: 'Created', student }));
  } catch (error) {
    res.statusCode = HTTP.BAD_REQUEST;
    return res.end(JSON.stringify({ error: error.message }));
  }
}

async function updateStudent(req, res, id) {
  if (!Number.isInteger(id) || id < 1) {
    res.statusCode = HTTP.BAD_REQUEST;
    return res.end(JSON.stringify({ error: 'Invalid id' }));
  }

  try {
    const updates = await readJsonBody(req);

    if (!isValidStudentPatchBody(updates)) {
      res.statusCode = HTTP.BAD_REQUEST;
      return res.end(JSON.stringify({ error: 'Invalid body' }));
    }

    if ('id' in updates) {
      res.statusCode = HTTP.BAD_REQUEST;
      return res.end(JSON.stringify({ error: 'Cannot change id' }));
    }

    const student = studentService.updateStudent(id, updates);

    if (!student) {
      res.statusCode = HTTP.NOT_FOUND;
      return res.end(JSON.stringify({ error: 'Student not found' }));
    }

    res.statusCode = HTTP.OK;
    return res.end(JSON.stringify({ message: 'Updated', student }));
  } catch (error) {
    res.statusCode = HTTP.BAD_REQUEST;
    return res.end(JSON.stringify({ error: error.message }));
  }
}

function deleteStudent(req, res, id) {
  if (!Number.isInteger(id) || id < 1) {
    res.statusCode = HTTP.BAD_REQUEST;
    return res.end(JSON.stringify({ error: 'Invalid id' }));
  }

  const removed = studentService.deleteStudent(id);

  if (!removed) {
    res.statusCode = HTTP.NOT_FOUND;
    return res.end(JSON.stringify({ error: 'Student not found' }));
  }

  res.statusCode = HTTP.OK;
  return res.end(JSON.stringify({ message: 'Student removed' }));
}

export default {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
