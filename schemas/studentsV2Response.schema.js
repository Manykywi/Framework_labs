import studentSchema from './student.schema.js';

const studentsV2ResponseSchema = {
  type: 'object',
  properties: {
    data: { type: 'array', items: studentSchema },
    meta: {
      type: 'object',
      properties: {
        total: { type: 'integer', minimum: 0 },
        page: { type: 'integer', minimum: 1 },
        limit: { type: 'integer', minimum: 1 },
        totalPages: { type: 'integer', minimum: 0 },
      },
      required: ['total', 'page', 'limit', 'totalPages'],
      additionalProperties: false,
    },
  },
  required: ['data', 'meta'],
  additionalProperties: false,
};

export default studentsV2ResponseSchema;
