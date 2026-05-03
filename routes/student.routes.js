import studentController from '#controllers/student.controller';
import studentCreateBodySchema from '#schemas/studentCreateBody.schema';
import studentPatchBodySchema from '#schemas/studentPatchBody.schema';
import studentParamsSchema from '#schemas/studentParams.schema';
import studentQuerySchema from '#schemas/studentQuery.schema';
import studentsListResponseSchema from '#schemas/studentsListResponse.schema';
import studentCreatedResponseSchema from '#schemas/studentCreatedResponse.schema';
import studentUpdatedResponseSchema from '#schemas/studentUpdatedResponse.schema';
import studentRemovedResponseSchema from '#schemas/studentRemovedResponse.schema';

async function studentRoutes(fastify) {
  fastify.get(
    '/students/export',
    {},
    studentController.exportStudents
  );

  fastify.post(
    '/students/import',
    {},
    studentController.importStudents
  );

  fastify.get(
    '/students',
    {
      schema: {
        querystring: studentQuerySchema,
        response: {
          200: studentsListResponseSchema,
        },
      },
    },
    studentController.getStudents
  );

  fastify.post(
    '/students',
    {
      schema: {
        body: studentCreateBodySchema,
        response: {
          201: studentCreatedResponseSchema,
        },
      },
    },
    studentController.createStudent
  );

  fastify.patch(
    '/students/:id',
    {
      schema: {
        params: studentParamsSchema,
        body: studentPatchBodySchema,
        response: {
          200: studentUpdatedResponseSchema,
        },
      },
    },
    studentController.updateStudent
  );

  fastify.delete(
    '/students/:id',
    {
      schema: {
        params: studentParamsSchema,
        response: {
          200: studentRemovedResponseSchema,
        },
      },
    },
    studentController.deleteStudent
  );

  fastify.post(
    '/students/:id/image',
    {
      schema: {
        params: studentParamsSchema,
      },
    },
    studentController.uploadImage
  );
}

export default studentRoutes;
