import studentController from '#controllers/student.controller';
import studentsV2QuerySchema from '#schemas/studentsV2Query.schema';
import studentsV2ResponseSchema from '#schemas/studentsV2Response.schema';

async function studentRoutesV2(fastify) {
  fastify.get(
    '/students',
    {
      schema: {
        tags: ['students-v2'],
        summary: 'Get students with pagination',
        querystring: studentsV2QuerySchema,
        response: { 200: studentsV2ResponseSchema },
      },
    },
    studentController.getStudentsPaginated
  );
}

export default studentRoutesV2;
