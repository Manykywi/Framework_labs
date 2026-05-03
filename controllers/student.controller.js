import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import Ajv from 'ajv';
import studentService from '#services/student.service';
import HTTP from '#constants/httpStatus';
import ERROR_MESSAGES from '#constants/errorMessages';
import { buildImageUrl } from '../src/utils/imageUrl.js';
import studentCreateBodySchema from '#schemas/studentCreateBody.schema';

const ajv = new Ajv({ coerceTypes: true });
const validateStudent = ajv.compile(studentCreateBodySchema);

function withImageUrl(request, student) {
  return { ...student, image: buildImageUrl(request, student.image) };
}

async function getStudents(request, reply) {
  const course = request.query?.course;
  const results = await studentService.getAllStudents(course);
  const items = results.map((s) => withImageUrl(request, s));
  reply.code(HTTP.OK).send({ count: items.length, items });
}

async function createStudent(request, reply) {
  const data = request.body;
  const student = await studentService.createStudent(data);
  return reply.code(HTTP.CREATED).send({ message: 'Created', student: withImageUrl(request, student) });
}

async function updateStudent(request, reply) {
  const { id } = request.params;
  const updates = request.body;
  const student = await studentService.updateStudent(id, updates);
  if (!student) {
    return reply.notFound(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }
  return reply.code(HTTP.OK).send({ message: 'Updated', student: withImageUrl(request, student) });
}

async function deleteStudent(request, reply) {
  const { id } = request.params;
  const removed = await studentService.deleteStudent(id);
  if (!removed) {
    return reply.notFound(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }
  return reply.code(HTTP.OK).send({ message: 'Student removed' });
}

async function exportStudents(request, reply) {
  const students = await studentService.getAllStudents();
  const rows = students.map((s) => ({ ...s, image: buildImageUrl(request, s.image) }));
  const csv = stringify(rows, { header: true });
  reply
    .header('Content-Type', 'text/csv')
    .header('Content-Disposition', 'attachment; filename="items.csv"')
    .send(csv);
}

async function importStudents(request, reply) {
  const data = await request.file();
  const buffer = await data.toBuffer();

  let records;
  if (data.mimetype === 'application/json' || data.filename.endsWith('.json')) {
    records = JSON.parse(buffer.toString());
  } else if (data.mimetype === 'text/csv' || data.filename.endsWith('.csv')) {
    records = parse(buffer, { columns: true, skip_empty_lines: true });
  } else {
    return reply.badRequest('Only JSON or CSV files are supported');
  }

  let imported = 0;
  const rejected = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const { id: _id, image: _image, ...data } = record;

    if (data.grades && typeof data.grades === 'string') {
      try {
        data.grades = JSON.parse(data.grades);
      } catch {
        data.grades = data.grades.split(',').map(Number);
      }
    }
    if (data.course !== undefined) data.course = Number(data.course);

    const valid = validateStudent(data);
    if (!valid) {
      rejected.push({ index: i + 1, reason: ajv.errorsText(validateStudent.errors) });
      continue;
    }

    await studentService.createStudent(data);
    imported++;
  }

  return reply.code(HTTP.OK).send({ imported, rejected });
}

async function uploadImage(request, reply) {
  const { id } = request.params;

  const student = await studentService.getStudentById(id);
  if (!student) {
    return reply.notFound(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  const data = await request.file();

  if (!['image/jpeg', 'image/png'].includes(data.mimetype)) {
    return reply.badRequest('Only JPEG and PNG images are allowed');
  }

  const uploadDir = path.join(process.cwd(), 'uploads', String(id));
  await mkdir(uploadDir, { recursive: true });

  const imagePath = path.join(uploadDir, 'image.jpg');
  await pipeline(data.file, createWriteStream(imagePath));

  const updated = await studentService.updateStudent(id, { image: `/${id}/image.jpg` });

  return reply.code(HTTP.OK).send({ message: 'Image uploaded', student: withImageUrl(request, updated) });
}

export default {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  exportStudents,
  importStudents,
  uploadImage,
};
