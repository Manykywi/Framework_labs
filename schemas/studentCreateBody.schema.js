const studentCreateBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    course: { type: 'integer', minimum: 1 },
    grades: {
      type: 'array',
      items: { type: 'number' },
    },
    email: { type: 'string' },
  },
  required: ['name', 'course', 'grades', 'email'],
  additionalProperties: false,
};

export default studentCreateBodySchema;
