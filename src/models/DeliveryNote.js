import { Schema, model } from 'mongoose';

const deliveryNoteSchema = new Schema({
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
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  format: {
    type: String,
    enum: ['material', 'hours'],
    required: true
  },
  description: {
    type: String
  },
  workDate: {
    type: Date,
    required: true
  },
  // Para format: 'material'
  material: String,
  quantity: Number,
  unit: String,
  // Para format: 'hours'
  hours: Number,
  workers: [{
    name: String,
    hours: Number
  }],
  // Firma
  signed: {
    type: Boolean,
    default: false,
    index: true
  },
  signedAt: Date,
  signatureUrl: String,
  pdfUrl: String,
  deleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

const DeliveryNote = model('DeliveryNote', deliveryNoteSchema);
export default DeliveryNote;
