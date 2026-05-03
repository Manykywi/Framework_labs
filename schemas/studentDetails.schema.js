const studentDetailsSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string' },
    course: { type: 'integer' },
    grades: { type: 'array', items: { type: 'number' } },
    email: { type: 'string' },
    image: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    courseDetails: {
      anyOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            credits: { type: 'integer' },
          },
          additionalProperties: false,
        },
        { type: 'null' },
      ],
    },
  },
  required: ['id', 'name', 'course', 'grades', 'email'],
  additionalProperties: false,
};

export default studentDetailsSchema;
