const express = require('express');
const PDFDocument = require('pdfkit');
const { db } = require('../config/firebaseAdmin');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// GET: Generate PDF Security Deposit Refund Notice
router.get('/refund-pdf/:propertyId', verifyToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const propSnap = await db.collection('properties').doc(propertyId).get();

    if (!propSnap.exists) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = propSnap.data();

    // Fetch Move-In Inspection for Hash Proof
    const inspSnap = await db.collection('inspections')
      .where('propertyId', '==', propertyId)
      .where('type', '==', 'MOVE_IN')
      .limit(1)
      .get();

    const moveInData = inspSnap.empty ? null : inspSnap.docs[0].data();

    // Set headers to download PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Deposit_Refund_Notice_${propertyId}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // PDF Header
    doc.fontSize(18).font('Helvetica-Bold').text('FORMAL NOTICE: SECURITY DEPOSIT REFUND & HANDOVER', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.moveDown();

    // Property & Deposit Details
    doc.fontSize(12).font('Helvetica-Bold').text(`Property: ${property.title}`);
    doc.font('Helvetica').text(`Landlord Email: ${property.landlordEmail}`);
    doc.text(`Move-In Date: ${property.moveInDate}`);
    doc.text(`Total Security Deposit Held: INR ${Number(property.depositAmount).toLocaleString('en-IN')}`);
    doc.moveDown();

    // Cryptographic Proof Section
    doc.font('Helvetica-Bold').text('Cryptographic Move-In Baseline Verification:');
    if (moveInData) {
      doc.fontSize(10).font('Helvetica')
        .text(`• Move-In SHA-256 Ledger Hash: ${moveInData.sha256Hash}`)
        .text(`• Landlord Countersigned: ${moveInData.landlordApproved ? 'YES (' + moveInData.landlordSignedAt + ')' : 'PENDING'}`)
        .text(`• Total Documented Items: ${moveInData.items.length} timestamped & geo-tagged records`);
    } else {
      doc.fontSize(10).text('No move-in ledger attached.');
    }

    doc.moveDown(2);
    doc.fontSize(11).text(
      'As per the documented move-in and move-out condition ledger above, the premises are being handed over in agreed condition subject only to normal wear and tear. Kindly process the full refundable security deposit within 7 working days.',
      { align: 'justify' }
    );

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Could not generate PDF notice' });
  }
});

module.exports = router;