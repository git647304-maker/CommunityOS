export const EVENTS = {
  ORDER_CREATED: 'order:created',

  ORDER_ACCEPTED: 'order:accepted',

  ORDER_ASSIGNED: 'order:assigned',

  ORDER_IN_PROGRESS: 'order:in_progress',

  ORDER_COMPLETED: 'order:completed',

  ORDER_CANCELLED: 'order:cancelled',

  PAYMENT_INITIATED: 'payment:initiated',

  PAYMENT_COMPLETED: 'payment:completed',

  PAYMENT_FAILED: 'payment:failed',

  // Timeline update event emitted after creating events so that
  // websocket subscribers can be notified to refresh timelines.
  TIMELINE_UPDATED: 'timeline:updated',
};
