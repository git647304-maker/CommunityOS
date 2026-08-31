/**
 * CommunityOS Event System
 *
 * This file manages application events such as:
 *
 * ORDER_CREATED
 * ORDER_ACCEPTED
 * ORDER_ASSIGNED
 * ORDER_IN_PROGRESS
 * ORDER_COMPLETED
 *
 * Event handlers can be either normal functions or async functions.
 */

const eventHandlers = new Map();

/**
 * Register an event handler.
 *
 * Example:
 *
 * on(EVENTS.ORDER_CREATED, (payload) => {
 *   console.log("Order created:", payload);
 * });
 */
export function on(eventName, handler) {
  if (typeof handler !== 'function') {
    throw new TypeError(
      `Event handler for "${eventName}" must be a function`
    );
  }

  if (!eventHandlers.has(eventName)) {
    eventHandlers.set(eventName, []);
  }

  eventHandlers.get(eventName).push(handler);
}

/**
 * Emit an event.
 *
 * IMPORTANT:
 * Event handlers may return:
 *
 * - undefined
 * - a Promise
 *
 * Promise.resolve() allows us to safely handle both.
 */
export async function emit(eventName, payload) {
  const handlers = eventHandlers.get(eventName) || [];

  await Promise.all(
    handlers.map(async (handler) => {
      try {
        await Promise.resolve(handler(payload));
      } catch (error) {
        console.error(
          `Event handler failed for ${eventName}:`,
          error
        );
      }
    })
  );
}

/**
 * CommunityOS event names.
 */
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
};
