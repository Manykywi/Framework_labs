import HTTP from '#constants/httpStatus';

function getHealth(request, reply) {
  reply.code(HTTP.OK).send({ status: 'ok' });
}

function getHealthDetails(request, reply) {
  reply.code(HTTP.OK).send({
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()),
    memoryUsage: process.memoryUsage(),
  });
}

export default {
  getHealth,
  getHealthDetails,
};
