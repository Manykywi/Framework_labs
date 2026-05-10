function mapDoc(doc) {
  const { _id, __v, ...rest } = doc;
  return { ...rest, id: _id.toString() };
}

export class StudentRepository {
  constructor(mongoose) {
    this.Student = mongoose.model('Student');
  }

  async findAll(course) {
    const filter = course ? { course: Number(course) } : {};
    const docs = await this.Student.find(filter).lean();
    return docs.map(mapDoc);
  }

  async findById(id) {
    try {
      const doc = await this.Student.findById(id).lean();
      if (!doc) return null;
      return mapDoc(doc);
    } catch {
      return null;
    }
  }

  async create(data) {
    const doc = await this.Student.create(data);
    return mapDoc(doc.toObject());
  }

  async update(id, updates) {
    try {
      const doc = await this.Student.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      ).lean();
      if (!doc) return null;
      return mapDoc(doc);
    } catch {
      return null;
    }
  }

  async remove(id) {
    try {
      const result = await this.Student.findByIdAndDelete(id);
      return !!result;
    } catch {
      return false;
    }
  }

  async count(course) {
    const filter = course ? { course: Number(course) } : {};
    return this.Student.countDocuments(filter);
  }

  async findPaginated(course, page = 1, limit = 10) {
    const filter = course ? { course: Number(course) } : {};
    const docs = await this.Student.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return docs.map(mapDoc);
  }

  async *findAllStream() {
    const cursor = this.Student.find({}).lean().cursor();
    for await (const doc of cursor) {
      yield mapDoc(doc);
    }
  }
}
