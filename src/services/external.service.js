import { fetchWithRetry } from './fetchUtils.js';
import { REDIS_KEYS } from '../../constants/redisKeys.js';

const EXTERNAL_URL = 'http://localhost:3001';
const TTL = 120;

export function createExternalService({ redis }) {
  return {
    async getCourseDetails(courseId) {
      const cached = await redis.get(REDIS_KEYS.referenceCache);
      if (cached !== null) {
        const courses = JSON.parse(cached);
        return courses.find((c) => c.id === courseId) ?? null;
      }

      try {
        const response = await fetchWithRetry(`${EXTERNAL_URL}/courses`);
        const courses = await response.json();
        await redis.set(REDIS_KEYS.referenceCache, JSON.stringify(courses), 'EX', TTL);
        return courses.find((c) => c.id === courseId) ?? null;
      } catch {
        return null;
      }
    },
  };
}
