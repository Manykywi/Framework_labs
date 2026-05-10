const studentPatchBodySchema = {
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
  minProperties: 1,
  additionalProperties: false,
};

export default studentPatchBodySchema;
