import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createExternalService } from '../../src/services/external.service.js';

vi.mock('../../src/services/fetchUtils.js', () => ({
  fetchWithRetry: vi.fn(),
}));

import { fetchWithRetry } from '../../src/services/fetchUtils.js';

const COURSES = [
  { id: 1, name: 'Math' },
  { id: 2, name: 'Physics' },
];

describe('ExternalService', () => {
  let mockRedis;
  let service;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
    };
    service = createExternalService({ redis: mockRedis });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns course from cache without fetching', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify(COURSES));
    const result = await service.getCourseDetails(1);
    expect(result).toEqual({ id: 1, name: 'Math' });
    expect(fetchWithRetry).not.toHaveBeenCalled();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('fetches, caches, and returns course on cache miss', async () => {
    fetchWithRetry.mockResolvedValue({ json: vi.fn().mockResolvedValue(COURSES) });
    const result = await service.getCourseDetails(2);
    expect(fetchWithRetry).toHaveBeenCalledOnce();
    expect(mockRedis.set).toHaveBeenCalledOnce();
    const [, value, , ttl] = mockRedis.set.mock.calls[0];
    expect(JSON.parse(value)).toEqual(COURSES);
    expect(ttl).toBe(120);
    expect(result).toEqual({ id: 2, name: 'Physics' });
  });

  it('returns null when course id not in fetched list', async () => {
    fetchWithRetry.mockResolvedValue({ json: vi.fn().mockResolvedValue(COURSES) });
    const result = await service.getCourseDetails(99);
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    fetchWithRetry.mockRejectedValue(new Error('Network error'));
    const result = await service.getCourseDetails(1);
    expect(result).toBeNull();
  });

  it('returns null when courseId missing from cached list', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify(COURSES));
    const result = await service.getCourseDetails(99);
    expect(result).toBeNull();
    expect(fetchWithRetry).not.toHaveBeenCalled();
  });
});
