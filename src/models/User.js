import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true
  },
  name: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  nif: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'guest'], 
    default: 'admin',
    index: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'verified'], 
    default: 'pending',
    index: true 
  },
  verificationCode: {
    type: String
  },
  verificationAttempts: { 
    type: Number, 
    default: 3
  },
  company: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    index: true
  },
  address: {
    street: String,
    number: String,
    postal: String,
    city: String,
    province: String
  },
  deleted: { 
    type: Boolean, 
    default: false
  }
}, {
  timestamps: true, 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.lastName}`;
});

const User = model('User', userSchema);
export default User;