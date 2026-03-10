const studentBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    course: { type: 'integer', minimum: 1 },
    grades: {
      type: 'array',
      items: { type: 'number' },
    },
  },
  required: ['name', 'course', 'grades'],
  additionalProperties: false,
};

export default studentBodySchema;
