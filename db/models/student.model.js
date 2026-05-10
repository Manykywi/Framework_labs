import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  course: { type: Number, required: true },
  grades: { type: [Number], default: [] },
  email: { type: String, required: true },
  image: { type: String, default: null },
});

export const Student = mongoose.model('Student', studentSchema);
