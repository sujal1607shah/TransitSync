const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getServiceHistory,
} = require('../controllers/vehicle.controller');
const { authenticateUser } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post('/create', createVehicle);
router.post('/', createVehicle);
router.get('/', authenticateUser, getVehicles);
router.put('/update', authenticateUser, updateVehicle);
router.delete('/delete', authenticateUser, deleteVehicle);

router.get('/:id', authenticateUser, getVehicleById);
router.put('/:id', authenticateUser, updateVehicle);
router.delete('/:id', authenticateUser, authorizeRoles('ADMIN'), deleteVehicle);
router.get('/:id/service-history', authenticateUser, getServiceHistory);

module.exports = router;
