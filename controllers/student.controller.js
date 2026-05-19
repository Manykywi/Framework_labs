import { createWriteStream, createReadStream } from 'fs';
import { mkdir, access, readdir } from 'fs/promises';
import path from 'path';
import { Readable, PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import { stringify as csvStringifySync } from 'csv-stringify/sync';
import { stringify as csvStringify } from 'csv-stringify';
import { parse } from 'csv-parse/sync';
import Ajv from 'ajv';
import HTTP from '#constants/httpStatus';
import ERROR_MESSAGES from '#constants/errorMessages';
import { buildImageUrl } from '../src/utils/imageUrl.js';
import eventBus from '../src/events/eventBus.js';
import StudentTransform from '../src/transforms/studentTransform.js';
import NdjsonTransform from '../src/transforms/ndjsonTransform.js';
import studentCreateBodySchema from '#schemas/studentCreateBody.schema';

const ajv = new Ajv({ coerceTypes: true });
const validateStudent = ajv.compile(studentCreateBodySchema);

const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');

function withImageUrl(request, student) {
  return { ...student, image: buildImageUrl(request, student.image) };
}

async function getStudents(request, reply) {
  const course = request.query?.course;
  const results = await request.server.studentService.getAllStudents(course);
  const items = results.map((s) => withImageUrl(request, s));
  reply.code(HTTP.OK).send({ count: items.length, items });
}

async function getStudentsPaginated(request, reply) {
  const { page = 1, limit = 10, course } = request.query;
  const result = await request.server.studentService.getStudentsPaginated(course, Number(page), Number(limit));
  const data = result.data.map((s) => withImageUrl(request, s));
  return reply.code(HTTP.OK).send({ data, meta: result.meta });
}

async function createStudent(request, reply) {
  const data = request.body;
  const student = await request.server.studentService.createStudent(data);
  const result = withImageUrl(request, student);
  eventBus.emit('student:created', result);
  return reply.code(HTTP.CREATED).send({ message: 'Created', student: result });
}

async function updateStudent(request, reply) {
  const { id } = request.params;
  const updates = request.body;
  const student = await request.server.studentService.updateStudent(id, updates);
  if (!student) return reply.notFound(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  const result = withImageUrl(request, student);
  eventBus.emit('student:updated', result);
  return reply.code(HTTP.OK).send({ message: 'Updated', student: result });
}

async function deleteStudent(request, reply) {
  const { id } = request.params;
  const removed = await request.server.studentService.deleteStudent(id);
  if (!removed) return reply.notFound(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  eventBus.emit('student:deleted', Number(id));
  return reply.code(HTTP.OK).send({ message: 'Student removed' });
}

async function getStudentDetails(request, reply) {
  const { id } = request.params;
  const student = await request.server.studentService.getStudentById(id);
  if (!student) return reply.notFound(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  const courseDetails = await request.server.externalService.getCourseDetails(student.course);
  return reply.code(HTTP.OK).send({ ...withImageUrl(request, student), courseDetails });
}

async function exportStudents(request, reply) {
  const useTransform = request.query.transform === 'true';

  if (useTransform) {
    const source = Readable.from(request.server.studentRepo.findAllStream());
    const transform = new StudentTransform(request);
    const stringifier = csvStringify({ header: true });
    const output = new PassThrough();

    pipeline(source, transform, stringifier, output).catch((err) => output.destroy(err));

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="items.csv"');
    return reply.send(output);
  }

  const students = await request.server.studentService.getAllStudents();
  const rows = students.map((s) => ({ ...s, image: buildImageUrl(request, s.image) }));
  const csv = csvStringifySync(rows, { header: true });
  reply.header('Content-Type', 'text/csv');
  reply.header('Content-Disposition', 'attachment; filename="items.csv"');
  return reply.send(csv);
}

async function streamStudents(request, reply) {
  const source = Readable.from(request.server.studentRepo.findAllStream());
  const transform = new NdjsonTransform(request);
  const output = new PassThrough();

  pipeline(source, transform, output).catch((err) => output.destroy(err));

  reply.type('application/x-ndjson');
  return reply.send(output);
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
    const { id: _id, image: _image, ...body } = record;

    if (body.grades && typeof body.grades === 'string') {
      try {
        body.grades = JSON.parse(body.grades);
      } catch {
        body.grades = body.grades.split(',').map(Number);
      }
    }
    if (body.course !== undefined) body.course = Number(body.course);

    const valid = validateStudent(body);
    if (!valid) {
      rejected.push({ index: i + 1, reason: ajv.errorsText(validateStudent.errors) });
      continue;
    }

    await request.server.studentService.createStudent(body);
    imported++;
  }

  return reply.code(HTTP.OK).send({ imported, rejected });
}

async function uploadImage(request, reply) {
  const { id } = request.params;
  const student = await request.server.studentService.getStudentById(id);
  if (!student) return reply.notFound(ERROR_MESSAGES.STUDENT_NOT_FOUND);

  const data = await request.file();
  if (!['image/jpeg', 'image/png'].includes(data.mimetype)) {
    return reply.badRequest('Only JPEG and PNG images are allowed');
  }

  const uploadDir = path.join(process.cwd(), 'uploads', String(id));
  await mkdir(uploadDir, { recursive: true });
  await pipeline(data.file, createWriteStream(path.join(uploadDir, 'image.jpg')));

  const updated = await request.server.studentService.updateStudent(id, { image: `/${id}/image.jpg` });
  return reply.code(HTTP.OK).send({ message: 'Image uploaded', student: withImageUrl(request, updated) });
}

async function getBackup(request, reply) {
  const { timestamp } = request.params;
  const backupFile = path.join(BACKUPS_DIR, `${timestamp}.gz`);

  try {
    await access(backupFile);
  } catch {
    return reply.notFound('Backup not found');
  }

  reply.header('Content-Type', 'application/gzip');
  reply.header('Content-Disposition', `attachment; filename="${timestamp}.gz"`);
  return reply.send(createReadStream(backupFile));
}

async function listBackups(request, reply) {
  let files = [];
  try {
    files = (await readdir(BACKUPS_DIR)).filter((f) => f.endsWith('.gz')).sort().reverse();
  } catch {
    files = [];
  }
  return reply.code(HTTP.OK).send({ backups: files.map((f) => f.replace('.gz', '')) });
}

export default {
  getStudents,
  getStudentsPaginated,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentDetails,
  exportStudents,
  streamStudents,
  importStudents,
  uploadImage,
  getBackup,
  listBackups,
};
