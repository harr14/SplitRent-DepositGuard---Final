const express = require('express');
const crypto = require('crypto');
const { FieldValue } = require('firebase-admin/firestore');
const { db } = require('../config/firebaseAdmin');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const router = express.Router();

// POST: Seal Move-In or Move-Out Inspection with SHA-256 Hash (TENANT only)
router.post('/seal', verifyToken, requireRole('TENANT'), async (req, res) => {
  try {
    const { propertyId, type, items } = req.body;
    const tenantId = req.user.uid;

    if (!propertyId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Property ID and inspection items are required.' });
    }

    const canonicalPayload = JSON.stringify({
      propertyId,
      type: type || 'MOVE_IN',
      items: items.map(item => ({
        room: item.room,
        note: item.note,
        imageUrl: item.imageUrl,
        lat: item.lat || null,
        lng: item.lng || null
      }))
    });

    const sha256Hash = crypto
      .createHash('sha256')
      .update(canonicalPayload)
      .digest('hex');

    const inspectionDoc = {
      propertyId,
      type: type || 'MOVE_IN',
      items,
      sha256Hash,
      tenantSignedBy: tenantId,
      tenantSignedAt: new Date().toISOString(),
      landlordApproved: false,
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('inspections').add(inspectionDoc);

    res.status(201).json({
      message: 'Inspection sealed with SHA-256 hash',
      inspectionId: docRef.id,
      sha256Hash
    });
  } catch (error) {
    console.error('Error sealing inspection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH: Landlord Digital Sign-Off (LANDLORD only)
router.patch('/approve/:inspectionId', verifyToken, requireRole('LANDLORD'), async (req, res) => {
  try {
    const landlordId = req.user.uid;
    const { inspectionId } = req.params;

    await db.collection('inspections').doc(inspectionId).update({
      landlordApproved: true,
      landlordSignedBy: landlordId,
      landlordSignedAt: new Date().toISOString()
    });

    res.json({ message: 'Inspection digitally countersigned by landlord.' });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Failed to countersign inspection' });
  }
});

module.exports = router;