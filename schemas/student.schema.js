const studentSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    course: { type: 'integer', minimum: 1 },
    grades: {
      type: 'array',
      items: { type: 'number' },
    },
    email: { type: 'string' },
    image: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
  required: ['id', 'name', 'course', 'grades', 'email'],
  additionalProperties: false,
};

export default studentSchema;
