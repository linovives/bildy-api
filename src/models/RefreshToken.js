import { Schema, model } from 'mongoose';

const refreshTokenSchema = new Schema({
  token: { 
    type: String, 
    required: true, 
    unique: true 
  },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
  },
    expiryDate: { 
      type: Date, 
      required: true 
  }
}, 
{ 
  timestamps: true 
});

export default model('RefreshToken', refreshTokenSchema);