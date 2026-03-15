import HTTP from '#constants/httpStatus';

function getHealth(req, res) {
  res.statusCode = HTTP.OK;
  res.end(
    JSON.stringify({
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
    })
  );
}

export default {
  getHealth,
};
