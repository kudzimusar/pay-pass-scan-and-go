import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { UserService } from '../services/UserService';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async register(req: Request, res: Response) {
    try {
      const userData = req.body;
      const result = await this.userService.createUser(userData);
      
      logger.info('User registered successfully', { userId: result.user.id });
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      logger.error('Registration failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.userService.authenticateUser(email, password);
      
      logger.info('User logged in successfully', { userId: result.user.id });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Login failed:', error);
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      await this.userService.logoutUser(userId);
      
      logger.info('User logged out successfully', { userId });
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await this.userService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);
      res.status(401).json({
        success: false,
        error: 'Token refresh failed'
      });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const user = await this.userService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get profile failed:', error);
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const updateData = req.body;
      const user = await this.userService.updateUser(userId, updateData);
      
      logger.info('User profile updated', { userId });
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Profile update failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      });
    }
  }

  async deleteProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      await this.userService.deleteUser(userId);
      
      logger.info('User profile deleted', { userId });
      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      logger.error('Profile deletion failed:', error);
      res.status(500).json({
        success: false,
        error: 'Deletion failed'
      });
    }
  }

  async verifyIdentity(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const identityData = req.body;
      const result = await this.userService.verifyIdentity(userId, identityData);
      
      logger.info('Identity verification initiated', { userId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Identity verification failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
    }
  }

  async getVerificationStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const status = await this.userService.getVerificationStatus(userId);
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get verification status failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get verification status'
      });
    }
  }

  async uploadDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const documents = req.body.documents;
      const result = await this.userService.uploadDocuments(userId, documents);
      
      logger.info('Documents uploaded', { userId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Document upload failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  }

  async getFriends(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const friends = await this.userService.getFriends(userId);
      
      res.status(200).json({
        success: true,
        data: friends
      });
    } catch (error) {
      logger.error('Get friends failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get friends'
      });
    }
  }

  async addFriend(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const friendData = req.body;
      const friend = await this.userService.addFriend(userId, friendData);
      
      logger.info('Friend added', { userId, friendId: friend.id });
      res.status(201).json({
        success: true,
        data: friend
      });
    } catch (error) {
      logger.error('Add friend failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add friend'
      });
    }
  }

  async removeFriend(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const friendId = req.params.friendId;
      await this.userService.removeFriend(userId, friendId);
      
      logger.info('Friend removed', { userId, friendId });
      res.status(200).json({
        success: true,
        message: 'Friend removed successfully'
      });
    } catch (error) {
      logger.error('Remove friend failed:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to remove friend'
      });
    }
  }

  async verifyFriend(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const friendId = req.params.friendId;
      const result = await this.userService.verifyFriend(userId, friendId);
      
      logger.info('Friend verified', { userId, friendId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Friend verification failed:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to verify friend'
      });
    }
  }

  async getUserActivity(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const activity = await this.userService.getUserActivity(userId);
      
      res.status(200).json({
        success: true,
        data: activity
      });
    } catch (error) {
      logger.error('Get user activity failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user activity'
      });
    }
  }

  async getUserStatistics(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const statistics = await this.userService.getUserStatistics(userId);
      
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Get user statistics failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user statistics'
      });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, role, status } = req.query;
      const users = await this.userService.getAllUsers({
        page: Number(page),
        limit: Number(limit),
        role: role as string,
        status: status as string
      });
      
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error('Get all users failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users'
      });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const user = await this.userService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get user by ID failed:', error);
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  }

  async updateUserStatus(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const { status } = req.body;
      const user = await this.userService.updateUserStatus(userId, status);
      
      logger.info('User status updated', { userId, status });
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Update user status failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Status update failed'
      });
    }
  }

  async updateUserRole(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const { role } = req.body;
      const user = await this.userService.updateUserRole(userId, role);
      
      logger.info('User role updated', { userId, role });
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Update user role failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Role update failed'
      });
    }
  }
}