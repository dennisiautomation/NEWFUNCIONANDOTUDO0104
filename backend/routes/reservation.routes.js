const express = require('express');
const router = express.Router();

// Temporary controller for testing
const reservationController = {
  getReservations: (req, res) => {
    res.json({
      status: 'success',
      data: [
        {
          id: 'res-001',
          accountId: 'acc-usd-001',
          amount: 2000.00,
          currency: 'USD',
          status: 'pending',
          reference: 'RES-USD-001',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'res-002',
          accountId: 'acc-eur-001',
          amount: 1500.00,
          currency: 'EUR',
          status: 'confirmed',
          reference: 'RES-EUR-001',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ]
    });
  },
  createReservation: (req, res) => {
    res.json({
      status: 'success',
      message: 'Reservation created successfully',
      data: {
        id: 'res-' + Math.floor(Math.random() * 1000),
        ...req.body,
        status: 'pending',
        reference: `RES-${req.body.currency}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date()
      }
    });
  },
  confirmReservation: (req, res) => {
    const reservationId = req.params.id;
    res.json({
      status: 'success',
      message: 'Reservation confirmed successfully',
      data: {
        id: reservationId,
        status: 'confirmed',
        confirmedAt: new Date()
      }
    });
  }
};

// Routes
router.get('/', reservationController.getReservations);
router.post('/', reservationController.createReservation);
router.put('/:id/confirm', reservationController.confirmReservation);

module.exports = router;
