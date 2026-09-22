const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF Proof of Delivery document
 */
const generatePODPDF = async (podData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      // Header
      doc.fontSize(22).fillColor('#2563EB').text('TransitSync', { align: 'left' });
      doc.fontSize(10).fillColor('#64748B').text('Smart Fleet Management & Delivery System', { align: 'left' });
      doc.moveDown();

      doc.fontSize(16).fillColor('#0F172A').text('PROOF OF DELIVERY RECEIPT', { align: 'center', underline: true });
      doc.moveDown(1.5);

      // Metadata Box
      doc.fontSize(12).fillColor('#1E293B');
      doc.text(`POD ID: ${podData.podId}`);
      doc.text(`Trip ID: ${podData.tripID}`);
      doc.text(`Driver Name: ${podData.driverName || 'Alex Driver'}`);
      doc.text(`Receiver Name: ${podData.receiverName}`);
      doc.text(`Delivery Date: ${new Date(podData.deliveryDate || Date.now()).toLocaleString()}`);
      doc.text(`Delivery Location: ${podData.deliveryLocation || 'Client Destination Yard'}`);
      doc.text(`Notes: ${podData.deliveryNotes || 'Delivery completed in good condition.'}`);
      doc.moveDown();

      // Status Badge
      doc.fontSize(14).fillColor('#10B981').text(`Status: VERIFIED & CONFIRMED ✅`);
      doc.moveDown();

      // Footer
      doc.fontSize(9).fillColor('#94A3B8').text('Generated automatically by TransitSync Dispatch System', {
        align: 'center',
      });

      doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePODPDF };
