const path = require('path');
const fs = require('fs');
const ProofOfDelivery = require('../models/ProofOfDelivery');
const { generatePODPDF } = require('../services/pdf.service');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Submit Digital Proof of Delivery
// @route   POST /api/pod
// @access  Private
const submitPOD = async (req, res) => {
  try {
    const { tripID, receiverName, deliveryLocation, deliveryNotes, deliveryImage, signature } = req.body;

    const generatedId = `POD-${Math.floor(1000 + Math.random() * 9000)}`;

    const pod = await ProofOfDelivery.create({
      podId: generatedId,
      tripID: tripID || 'TRP-1045',
      driverName: req.user.name || 'Alex Driver',
      receiverName: receiverName || 'Client Store Manager',
      deliveryLocation: deliveryLocation || 'Client Yard B',
      deliveryNotes: deliveryNotes || 'Package delivered intact',
      deliveryImage: deliveryImage || '',
      signature: signature || '',
    });

    // Generate PDF file
    const pdfFileName = `${generatedId}.pdf`;
    const pdfPath = path.join(__dirname, '../../uploads/pod', pdfFileName);

    await generatePODPDF(pod, pdfPath);
    pod.pdfUrl = `/uploads/pod/${pdfFileName}`;
    await pod.save();

    return successResponse(res, 201, 'Proof of delivery submitted & PDF generated', pod);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get POD By ID
// @route   GET /api/pod/:id
// @access  Private
const getPOD = async (req, res) => {
  try {
    const pod = await ProofOfDelivery.findOne({
      $or: [{ podId: req.params.id }, { _id: req.params.id }],
    });
    if (!pod) {
      return errorResponse(res, 404, 'Proof of delivery not found');
    }
    return successResponse(res, 200, 'POD retrieved', pod);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Download / Stream POD PDF
// @route   GET /api/pod/:id/pdf
// @access  Private
const getPODPDF = async (req, res) => {
  try {
    const pod = await ProofOfDelivery.findOne({
      $or: [{ podId: req.params.id }, { _id: req.params.id }],
    });

    if (!pod || !pod.pdfUrl) {
      return errorResponse(res, 404, 'PDF file not available');
    }

    const fullPath = path.join(__dirname, '../../', pod.pdfUrl);
    if (!fs.existsSync(fullPath)) {
      return errorResponse(res, 404, 'PDF file missing on disk');
    }

    res.contentType('application/pdf');
    return res.sendFile(fullPath);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  submitPOD,
  getPOD,
  getPODPDF,
};
