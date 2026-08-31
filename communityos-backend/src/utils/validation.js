import Joi from 'joi';
import { ValidationError } from './errors.js';

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    fullName: Joi.string().min(2).required(),
    phone: Joi.string().optional(),
    tenantId: Joi.string().required(),
    role: Joi.string().valid('RESIDENT', 'PROVIDER_REP', 'MANAGER').optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createOrder: Joi.object({
    communityId: Joi.string().required(),
    providerId: Joi.string().optional(),
    items: Joi.array()
      .items(
        Joi.object({
          serviceId: Joi.string().required(),
          quantity: Joi.number().min(1).required(),
        })
      )
      .required(),
    notes: Joi.string().optional(),
  }),

  acceptOrder: Joi.object({
    orderId: Joi.string().required(),
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string()
      .valid('PROVIDER_ACCEPTED', 'WORKER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
      .required(),
  }),
};

export function validate(data, schema) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    throw new ValidationError(message);
  }

  return value;
}
