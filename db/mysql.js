import fp from 'fastify-plugin';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

async function mysqlPlugin(fastify) {
  const pool = mysql.createPool({
    host: fastify.config.MYSQL_HOST,
    port: fastify.config.MYSQL_PORT,
    user: fastify.config.MYSQL_USER,
    password: fastify.config.MYSQL_PASSWORD,
    database: fastify.config.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    const connection = await pool.getConnection();
    connection.release();
    fastify.log.info('MySQL pool connected');
  } catch (err) {
    fastify.log.error(err, 'MySQL connection error');
    process.exit(1);
  }

  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');

  for (const stmt of schemaSql.split(';').map((s) => s.trim()).filter((s) => s.length > 0)) {
    await pool.execute(stmt);
  }

  const currentHash = crypto.createHash('md5').update(schemaSql).digest('hex');
  const [rows] = await pool.execute('SELECT hash FROM migrations ORDER BY id DESC LIMIT 1');

  if (rows.length === 0) {
    await pool.execute('INSERT INTO migrations (hash) VALUES (?)', [currentHash]);
    fastify.log.info('Initial schema hash recorded');
  } else if (rows[0].hash !== currentHash) {
    fastify.log.warn('Schema has changed since last migration check');
  }

  fastify.decorate('mysql', pool);

  fastify.addHook('onClose', async () => {
    await pool.end();
    fastify.log.info('MySQL pool closed');
  });
}

export default fp(mysqlPlugin, { name: 'mysql-plugin' });
