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
    MYSQL_HOST: {
      type: 'string',
      minLength: 1,
    },
    MYSQL_PORT: {
      type: 'integer',
    },
    MYSQL_USER: {
      type: 'string',
      minLength: 1,
    },
    MYSQL_PASSWORD: {
      type: 'string',
    },
    MYSQL_DB: {
      type: 'string',
      minLength: 1,
    },
  },
  required: ['PORT', 'HOSTNAME', 'NODE_ENV', 'ADMIN_API_KEY', 'MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DB'],
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
