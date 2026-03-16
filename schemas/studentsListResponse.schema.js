import studentSchema from './student.schema.js';

const studentsListResponseSchema = {
  type: 'object',
  properties: {
    count: { type: 'integer', minimum: 0 },
    items: {
      type: 'array',
      items: studentSchema,
    },
  },
  required: ['count', 'items'],
  additionalProperties: false,
};

export default studentsListResponseSchema;
