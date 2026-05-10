const envSchema = {
  type: 'object',
  properties: {
    PORT: {
      type: 'integer',
      minimum: 1,
      maximum: 65535,
    },
    HOSTNAME: {
      type: 'string',
      minLength: 1,
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production'],
    },
    ADMIN_API_KEY: {
      type: 'string',
      minLength: 1,
    },
    CORS_ORIGIN: {
      type: 'string',
      minLength: 1,
    },
  },
  required: ['PORT', 'HOSTNAME', 'NODE_ENV', 'ADMIN_API_KEY'],
  allOf: [
    {
      if: {
        properties: {
          NODE_ENV: { const: 'production' },
        },
      },
      then: {
        required: ['CORS_ORIGIN'],
      },
    },
  ],
  additionalProperties: true,
};

export default envSchema;
