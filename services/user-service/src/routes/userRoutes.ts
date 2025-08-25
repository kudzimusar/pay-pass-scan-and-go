import express from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateUser } from '../middleware/validation';

const router = express.Router();
const userController = new UserController();

// User registration and authentication
router.post('/register', validateUser, userController.register);
router.post('/login', userController.login);
router.post('/logout', authMiddleware, userController.logout);
router.post('/refresh-token', userController.refreshToken);

// User profile management
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validateUser, userController.updateProfile);
router.delete('/profile', authMiddleware, userController.deleteProfile);

// User verification and KYC
router.post('/verify-identity', authMiddleware, userController.verifyIdentity);
router.get('/verification-status', authMiddleware, userController.getVerificationStatus);
router.post('/upload-documents', authMiddleware, userController.uploadDocuments);

// Friend network management
router.get('/friends', authMiddleware, userController.getFriends);
router.post('/friends', authMiddleware, userController.addFriend);
router.delete('/friends/:friendId', authMiddleware, userController.removeFriend);
router.put('/friends/:friendId/verify', authMiddleware, userController.verifyFriend);

// User analytics and activity
router.get('/activity', authMiddleware, userController.getUserActivity);
router.get('/statistics', authMiddleware, userController.getUserStatistics);

// Admin endpoints
router.get('/', authMiddleware, userController.getAllUsers);
router.get('/:userId', authMiddleware, userController.getUserById);
router.put('/:userId/status', authMiddleware, userController.updateUserStatus);
router.put('/:userId/role', authMiddleware, userController.updateUserRole);

export default router;