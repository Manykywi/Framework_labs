import studentController from '#controllers/student.controller';
import studentCreateBodySchema from '#schemas/studentCreateBody.schema';
import studentPatchBodySchema from '#schemas/studentPatchBody.schema';
import studentParamsSchema from '#schemas/studentParams.schema';
import studentQuerySchema from '#schemas/studentQuery.schema';
import studentsListResponseSchema from '#schemas/studentsListResponse.schema';
import studentCreatedResponseSchema from '#schemas/studentCreatedResponse.schema';
import studentUpdatedResponseSchema from '#schemas/studentUpdatedResponse.schema';
import studentRemovedResponseSchema from '#schemas/studentRemovedResponse.schema';
import studentDetailsSchema from '#schemas/studentDetails.schema';

const backupParamsSchema = {
  type: 'object',
  properties: { timestamp: { type: 'string' } },
  required: ['timestamp'],
};

async function studentRoutes(fastify) {
  fastify.get(
    '/students/export',
    {
      schema: {
        tags: ['students'],
        summary: 'Export students as CSV (?transform=true replaces grades with avgGrade)',
        querystring: {
          type: 'object',
          properties: { transform: { type: 'string', enum: ['true', 'false'] } },
          additionalProperties: false,
        },
      },
    },
    studentController.exportStudents
  );

  fastify.get(
    '/students/stream',
    {
      schema: {
        tags: ['students'],
        summary: 'Stream all students as NDJSON (application/x-ndjson)',
      },
    },
    studentController.streamStudents
  );

  fastify.post(
    '/students/import',
    { schema: { tags: ['students'], summary: 'Import students from CSV or JSON file' } },
    studentController.importStudents
  );

  fastify.get(
    '/students',
    {
      schema: {
        tags: ['students'],
        summary: 'Get all students',
        querystring: studentQuerySchema,
        response: { 200: studentsListResponseSchema },
      },
    },
    studentController.getStudents
  );

  fastify.post(
    '/students',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['students'],
        summary: 'Create a student',
        body: studentCreateBodySchema,
        response: { 201: studentCreatedResponseSchema },
      },
    },
    studentController.createStudent
  );

  fastify.patch(
    '/students/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['students'],
        summary: 'Update a student',
        params: studentParamsSchema,
        body: studentPatchBodySchema,
        response: { 200: studentUpdatedResponseSchema },
      },
    },
    studentController.updateStudent
  );

  fastify.delete(
    '/students/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['students'],
        summary: 'Delete a student',
        params: studentParamsSchema,
        response: { 200: studentRemovedResponseSchema },
      },
    },
    studentController.deleteStudent
  );

  fastify.post(
    '/students/:id/image',
    {
      schema: {
        tags: ['students'],
        summary: 'Upload student image',
        params: studentParamsSchema,
      },
    },
    studentController.uploadImage
  );

  fastify.get(
    '/students/:id/details',
    {
      schema: {
        tags: ['students'],
        summary: 'Get student with course details from external service',
        params: studentParamsSchema,
        response: { 200: studentDetailsSchema },
      },
    },
    studentController.getStudentDetails
  );

  fastify.get(
    '/backups',
    {
      preHandler: async (request, reply) => {
        if (request.headers['x-api-key'] !== fastify.config.ADMIN_API_KEY) {
          return reply.unauthorized('Unauthorized');
        }
      },
      schema: { tags: ['backups'], summary: 'List available backups (requires x-api-key)' },
    },
    studentController.listBackups
  );

  fastify.get(
    '/backups/:timestamp',
    {
      preHandler: async (request, reply) => {
        if (request.headers['x-api-key'] !== fastify.config.ADMIN_API_KEY) {
          return reply.unauthorized('Unauthorized');
        }
      },
      schema: {
        tags: ['backups'],
        summary: 'Download a backup file (requires x-api-key)',
        params: backupParamsSchema,
      },
    },
    studentController.getBackup
  );
}

export default studentRoutes;
