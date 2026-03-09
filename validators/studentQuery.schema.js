const studentQuerySchema = {
  type: "object",
  properties: {
    course: {
      type: "integer",
      minimum: 1
    }
  },
  additionalProperties: false
};

module.exports = studentQuerySchema;