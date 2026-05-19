export const REDIS_KEYS = {
  referenceCache: 'reference:courses',
  studentsPaginated: (page, limit, course) => `students:v2:${page}:${limit}:${course ?? 'all'}`,
  studentsV2Pattern: 'students:v2:*',
  refreshToken: (userId) => `refresh:${userId}`,
  blacklist: (jti) => `blacklist:${jti}`,
};
