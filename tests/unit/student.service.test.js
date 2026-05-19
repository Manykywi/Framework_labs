import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StudentService } from '../../services/student.service.js';

const SAMPLE_STUDENT = { id: 1, name: 'Alice', course: 1, grades: [90, 85], email: 'alice@test.com', image: null };
const PAGINATED_RESULT = {
  data: [SAMPLE_STUDENT],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

describe('StudentService', () => {
  let mockRepo;
  let mockRedis;
  let service;

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn().mockResolvedValue([SAMPLE_STUDENT]),
      findById: vi.fn().mockResolvedValue(SAMPLE_STUDENT),
      create: vi.fn().mockResolvedValue(SAMPLE_STUDENT),
      update: vi.fn().mockResolvedValue(SAMPLE_STUDENT),
      remove: vi.fn().mockResolvedValue(true),
      count: vi.fn().mockResolvedValue(1),
      findPaginated: vi.fn().mockResolvedValue([SAMPLE_STUDENT]),
    };
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      keys: vi.fn().mockResolvedValue([]),
    };
    service = new StudentService(mockRepo, mockRedis);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllStudents', () => {
    it('delegates to repo.findAll without course filter', async () => {
      const result = await service.getAllStudents();
      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([SAMPLE_STUDENT]);
    });

    it('passes course filter to repo.findAll', async () => {
      await service.getAllStudents(2);
      expect(mockRepo.findAll).toHaveBeenCalledWith(2);
    });
  });

  describe('getStudentsPaginated', () => {
    it('returns cached data on cache hit', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(PAGINATED_RESULT));
      const result = await service.getStudentsPaginated(undefined, 1, 10);
      expect(result).toEqual(PAGINATED_RESULT);
      expect(mockRepo.findPaginated).not.toHaveBeenCalled();
      expect(mockRepo.count).not.toHaveBeenCalled();
    });

    it('queries DB and caches result on cache miss', async () => {
      const result = await service.getStudentsPaginated(undefined, 1, 10);
      expect(mockRepo.findPaginated).toHaveBeenCalledWith(undefined, 1, 10);
      expect(mockRepo.count).toHaveBeenCalledWith(undefined);
      expect(mockRedis.set).toHaveBeenCalledOnce();
      expect(result.data).toEqual([SAMPLE_STUDENT]);
      expect(result.meta.total).toBe(1);
    });

    it('includes pagination params in cache key', async () => {
      await service.getStudentsPaginated(2, 3, 5);
      const [cacheKey] = mockRedis.set.mock.calls[0];
      expect(cacheKey).toContain('3');
      expect(cacheKey).toContain('5');
      expect(cacheKey).toContain('2');
    });
  });

  describe('createStudent', () => {
    it('creates student and invalidates cache', async () => {
      mockRedis.keys.mockResolvedValue(['students:v2:1:10:all']);
      const result = await service.createStudent({ name: 'Bob', course: 2, email: 'bob@test.com' });
      expect(mockRepo.create).toHaveBeenCalledOnce();
      expect(mockRedis.keys).toHaveBeenCalledOnce();
      expect(mockRedis.del).toHaveBeenCalledWith('students:v2:1:10:all');
      expect(result).toEqual(SAMPLE_STUDENT);
    });

    it('skips del when no cache keys exist', async () => {
      mockRedis.keys.mockResolvedValue([]);
      await service.createStudent({ name: 'Bob', course: 2, email: 'bob@test.com' });
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('updateStudent', () => {
    it('updates student and invalidates cache when found', async () => {
      mockRedis.keys.mockResolvedValue(['students:v2:1:10:all']);
      const result = await service.updateStudent(1, { name: 'Updated' });
      expect(mockRepo.update).toHaveBeenCalledWith(1, { name: 'Updated' });
      expect(mockRedis.keys).toHaveBeenCalledOnce();
      expect(result).toEqual(SAMPLE_STUDENT);
    });

    it('does not invalidate cache when student not found', async () => {
      mockRepo.update.mockResolvedValue(null);
      const result = await service.updateStudent(999, { name: 'X' });
      expect(result).toBeNull();
      expect(mockRedis.keys).not.toHaveBeenCalled();
    });
  });

  describe('deleteStudent', () => {
    it('deletes student and invalidates cache when found', async () => {
      mockRedis.keys.mockResolvedValue(['students:v2:1:10:all']);
      const result = await service.deleteStudent(1);
      expect(mockRepo.remove).toHaveBeenCalledWith(1);
      expect(mockRedis.keys).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });

    it('does not invalidate cache when student not found', async () => {
      mockRepo.remove.mockResolvedValue(false);
      const result = await service.deleteStudent(999);
      expect(result).toBe(false);
      expect(mockRedis.keys).not.toHaveBeenCalled();
    });
  });

  describe('getStudentById', () => {
    it('returns student from repo', async () => {
      const result = await service.getStudentById(1);
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(SAMPLE_STUDENT);
    });

    it('returns null when student not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const result = await service.getStudentById(999);
      expect(result).toBeNull();
    });
  });
});
