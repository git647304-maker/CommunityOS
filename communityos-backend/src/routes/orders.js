// Resident confirms a completed order
router.post('/:orderId/confirm', authMiddleware, tenantMiddleware, async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.orderId, req.tenantId);

    // Only the resident who created the order may confirm it
    if (order.residentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not allowed to confirm this order' });
    }

    // Update status to COMPLETED (resident confirmation)
    const updated = await orderService.updateOrderStatus(req.params.orderId, 'COMPLETED', req.tenantId);

    // Create timeline event for confirmation
    await eventService.createEvent(req.tenantId, order.id, 'ORDER_CONFIRMED', req.user.id, {});

    res.status(200).json({ success: true, message: 'Order confirmed', data: updated });
  } catch (error) {
    next(error);
  }
});
