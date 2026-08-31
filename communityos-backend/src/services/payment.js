import { prisma } from '../db/connection.js';
import logger from '../config/logger.js';

export async function createPayment(orderId, amount, tenantId) {
  const payment = await prisma.payment.create({
    data: {
      orderId,
      amount,
      status: 'PENDING',
    },
  });

  logger.info({ paymentId: payment.id, orderId, amount }, 'Payment created');

  return payment;
}

export async function simulateM2PesaPayment(phoneNumber, amount) {
  if (process.env.MPESA_SIMULATION !== 'true') {
    throw new Error('M-PESA simulation is disabled');
  }

  // Simulate M-PESA response
  const reference = `MPESA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  logger.info({ phoneNumber, amount, reference }, 'Simulated M-PESA payment');

  return {
    status: 'SUCCESS',
    reference,
    amount,
    phoneNumber,
    timestamp: new Date().toISOString(),
  };
}

export async function updatePaymentStatus(paymentId, status, reference = null) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      reference,
    },
  });

  logger.info({ paymentId, status }, 'Payment status updated');

  return payment;
}
