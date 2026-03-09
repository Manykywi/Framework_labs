const Ajv = require("ajv");
const configSchema = require("#validators/config.schema");

const ajv = new Ajv();

const envConfig = {
  PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
  HOSTNAME: process.env.HOSTNAME,
  NODE_ENV: process.env.NODE_ENV
};

const validate = ajv.compile(configSchema);

const valid = validate(envConfig);

if (!valid) {
  console.error("❌ Configuration validation failed:");

  for (const error of validate.errors) {
    console.error(`- ${error.instancePath} ${error.message}`);
  }

  process.exit(1);
}

module.exports = {
  PORT: envConfig.PORT,
  HOSTNAME: envConfig.HOSTNAME,
  NODE_ENV: envConfig.NODE_ENV,
  isDevelopment: envConfig.NODE_ENV === "development",
  isProduction: envConfig.NODE_ENV === "production"
};