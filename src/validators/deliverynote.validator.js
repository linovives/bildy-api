import { z } from 'zod';

const workerSchema = z.object({
  name: z.string().min(1),
  hours: z.number().positive()
});

export const createDeliveryNoteSchema = z.object({
  project: z.string().min(1, 'El proyecto es obligatorio'),
  client: z.string().min(1, 'El cliente es obligatorio'),
  format: z.enum(['material', 'hours'], { error: 'El formato debe ser material u hours' }),
  description: z.string().optional(),
  workDate: z.coerce.date({ error: 'La fecha de trabajo es obligatoria' }),
  // Para format: 'material'
  material: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  // Para format: 'hours'
  hours: z.number().positive().optional(),
  workers: z.array(workerSchema).optional()
}).refine(data => {
  if (data.format === 'material') return !!data.material;
  return true;
}, { message: 'El campo material es obligatorio para albaranes de material', path: ['material'] })
  .refine(data => {
    if (data.format === 'hours') return !!data.hours || (data.workers && data.workers.length > 0);
    return true;
  }, { message: 'Debes indicar horas o trabajadores para albaranes de horas', path: ['hours'] });
