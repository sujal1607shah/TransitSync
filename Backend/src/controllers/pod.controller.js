const path = require('path');
const fs = require('fs');
const ProofOfDelivery = require('../models/ProofOfDelivery');
const Trip = require('../models/Trip');
const { generatePODPDF } = require('../services/pdf.service');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Submit Digital Proof of Delivery in Caller's Organization
// @route   POST /api/pod
// @access  Private
const submitPOD = async (req, res) => {
  try {
    const { tripID, receiverName, deliveryLocation, deliveryNotes, deliveryImage, signature } = req.body;
    const orgId = req.user.organizationId;

    // Verify trip belongs to caller's organization
    if (tripID) {
      const trip = await Trip.findOne({
        $or: [{ tripID }, { _id: tripID.match(/^[0-9a-fA-F]{24}$/) ? tripID : null }],
        organizationId: orgId,
      });
      if (!trip) {
        return errorResponse(res, 400, 'Trip not found in your organization');
      }
    }

    const generatedId = `POD-${Math.floor(1000 + Math.random() * 9000)}`;

    const pod = await ProofOfDelivery.create({
      organizationId: orgId,
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
    const uploadDir = path.join(__dirname, '../../uploads/pod');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const pdfFileName = `${generatedId}.pdf`;
    const pdfPath = path.join(uploadDir, pdfFileName);

    await generatePODPDF(pod, pdfPath);
    pod.pdfUrl = `/uploads/pod/${pdfFileName}`;
    await pod.save();

    return successResponse(res, 201, 'Proof of delivery submitted & PDF generated', pod);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Get POD By ID (Scoped to Organization)
// @route   GET /api/pod/:id
// @access  Private
const getPOD = async (req, res) => {
  try {
    const pod = await ProofOfDelivery.findOne({
      $or: [{ podId: req.params.id }, { _id: req.params.id }],
      organizationId: req.user.organizationId,
    });
    if (!pod) {
      return errorResponse(res, 404, 'Proof of delivery not found in your organization');
    }
    return successResponse(res, 200, 'POD retrieved', pod);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc    Download / Stream POD PDF (Scoped to Organization)
// @route   GET /api/pod/:id/pdf
// @access  Private
const getPODPDF = async (req, res) => {
  try {
    const pod = await ProofOfDelivery.findOne({
      $or: [{ podId: req.params.id }, { _id: req.params.id }],
      organizationId: req.user.organizationId,
    });

    if (!pod || !pod.pdfUrl) {
      return errorResponse(res, 404, 'PDF file not available or not in your organization');
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
