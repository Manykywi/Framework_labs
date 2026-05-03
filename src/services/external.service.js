import { fetchWithRetry } from './fetchUtils.js';
import { getFromCache, saveToCache } from './cache.service.js';

const EXTERNAL_URL = 'http://localhost:3001';
const CACHE_KEY = 'reference';
const TTL = 120 * 1000;

async function getCourseDetails(courseId) {
  const cached = await getFromCache(CACHE_KEY);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data.find((c) => c.id === courseId) ?? null;
  }

  try {
    const response = await fetchWithRetry(`${EXTERNAL_URL}/courses`);
    const courses = await response.json();
    await saveToCache(CACHE_KEY, courses);
    return courses.find((c) => c.id === courseId) ?? null;
  } catch {
    return null;
  }
}

export default { getCourseDetails };
