import { Schema, model } from 'mongoose';

const projectSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  projectCode: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    number: String,
    postal: String,
    city: String,
    province: String
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  notes: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  deleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });

const Project = model('Project', projectSchema);
export default Project;
