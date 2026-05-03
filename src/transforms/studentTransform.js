import { Transform } from 'stream';
import { buildImageUrl } from '../utils/imageUrl.js';

class StudentTransform extends Transform {
  constructor(request) {
    super({ objectMode: true });
    this.request = request;
  }

  _transform(student, encoding, callback) {
    const { grades, ...rest } = student;
    const avgGrade =
      grades && grades.length
        ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2))
        : 0;
    callback(null, { ...rest, image: buildImageUrl(this.request, student.image), avgGrade });
  }
}

export default StudentTransform;
