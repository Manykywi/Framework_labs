import { Transform } from 'stream';
import { buildImageUrl } from '../utils/imageUrl.js';

class NdjsonTransform extends Transform {
  constructor(request) {
    super({ objectMode: true });
    this.request = request;
  }

  _transform(student, encoding, callback) {
    const item = { ...student, image: buildImageUrl(this.request, student.image) };
    callback(null, JSON.stringify(item) + '\n');
  }
}

export default NdjsonTransform;
