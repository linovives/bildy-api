import { Schema, model } from 'mongoose';

const companySchema = new Schema({
  owner: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  cif: { 
    type: String, 
    required: true,
    unique: true, 
    index: true 
  },
  address: {
    street: String,
    number: String,
    postal: String,
    city: String,
    province: String
  },
  logo: { 
    type: String 
  },
  isFreelance: { 
    type: Boolean, 
    default: false 
  },
  deleted: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

const Company = model('Company', companySchema);
export default Company;