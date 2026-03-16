const studentSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1 },
    course: { type: 'integer', minimum: 1 },
    grades: {
      type: 'array',
      items: { type: 'number' },
    },
  },
  required: ['id', 'name', 'course', 'grades'],
  additionalProperties: false,
};

export default studentSchema;
