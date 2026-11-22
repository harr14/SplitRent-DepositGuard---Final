const express = require('express');
const { FieldValue } = require('firebase-admin/firestore');
const { db } = require('../config/firebaseAdmin');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// POST: Log a shared rent/deposit/utility split
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { propertyId, title, category, totalAmount, splitCount, paidBy } = req.body;

    if (!propertyId || !title || !totalAmount || !splitCount) {
      return res.status(400).json({ error: 'All expense fields are required.' });
    }

    const perPersonShare = Number((Number(totalAmount) / Number(splitCount)).toFixed(2));

    const expenseDoc = {
      propertyId,
      title,
      category: category || 'RENT', // RENT, DEPOSIT, UTILITY
      totalAmount: Number(totalAmount),
      splitCount: Number(splitCount),
      perPersonShare,
      paidBy: paidBy || req.user.email,
      createdBy: req.user.uid,
      settled: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('expenses').add(expenseDoc);
    res.status(201).json({ id: docRef.id, ...expenseDoc });
  } catch (error) {
    console.error('Expense creation error:', error);
    res.status(500).json({ error: 'Failed to log split expense' });
  }
});

// PATCH: Mark a split expense as settled
router.patch('/settle/:expenseId', verifyToken, async (req, res) => {
  try {
    await db.collection('expenses').doc(req.params.expenseId).update({
      settled: true,
      settledAt: new Date().toISOString(),
    });
    res.json({ message: 'Expense marked as settled.' });
  } catch (error) {
    console.error('Settle error:', error);
    res.status(500).json({ error: 'Failed to settle expense' });
  }
});

module.exports = router;