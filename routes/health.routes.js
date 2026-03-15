import healthController from '#controllers/health.controller';

function handleHealthRoutes(req, res, pathname) {
  if (req.method !== 'GET') return false;

  if (
    pathname === '/health' ||
    pathname === '/api/health' ||
    pathname === '/health/' ||
    pathname === '/api/health/'
  ) {
    healthController.getHealth(req, res);
    return true;
  }

  return false;
}

export default handleHealthRoutes;
