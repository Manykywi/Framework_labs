import studentSchema from './student.schema.js';

const studentUpdatedResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    student: studentSchema,
  },
  required: ['message', 'student'],
  additionalProperties: false,
};

export default studentUpdatedResponseSchema;
