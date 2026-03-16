const healthResponseSchema = {
  type: 'object',
  properties: {
    pid: { type: 'integer' },
    nodeVersion: { type: 'string' },
    platform: { type: 'string' },
    uptime: { type: 'integer', minimum: 0 },
    memoryUsage: {
      type: 'object',
      additionalProperties: { type: 'number' },
    },
  },
  required: ['pid', 'nodeVersion', 'platform', 'uptime', 'memoryUsage'],
  additionalProperties: false,
};

export default healthResponseSchema;
