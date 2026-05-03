const studentsV2QuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    course: { type: 'integer', minimum: 1 },
  },
  additionalProperties: false,
};

export default studentsV2QuerySchema;
