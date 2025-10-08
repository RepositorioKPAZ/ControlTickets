import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from './client';

// JWT secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '24h';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResult {
  user: User;
  token: string;
}

export class MySQLAuth {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Sign up new user
  static async signUp(userData: {
    email: string;
    password: string;
    full_name?: string;
    role?: string;
  }): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await db.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await this.hashPassword(userData.password);

    // Create user
    const userId = uuidv4();
    await db.createUser({
      id: userId,
      email: userData.email,
      password_hash: passwordHash,
      full_name: userData.full_name,
      role: userData.role || 'agent',
    });

    // Get created user
    const user = await db.getUserById(userId);
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  // Sign in user
  static async signIn(email: string, password: string): Promise<AuthResult> {
    console.log('🔐 Intentando autenticar usuario:', email);
    
    // Get user by email
    const user = await db.getUserByEmail(email);
    if (!user) {
      console.log('❌ Usuario no encontrado');
      throw new Error('Invalid email or password');
    }

    console.log('✅ Usuario encontrado, verificando contraseña...');

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ Usuario inactivo');
      throw new Error('User account is deactivated');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password_hash);
    console.log('🔑 Verificación de contraseña:', isValidPassword ? '✅ Correcta' : '❌ Incorrecta');
    
    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user);
    console.log('🎫 Token generado correctamente');

    return { user, token };
  }

  // Get user from token
  static async getUserFromToken(token: string): Promise<User | null> {
    const decoded = this.verifyToken(token);
    if (!decoded) {
      return null;
    }

    return await db.getUserById(decoded.id);
  }

  // Reset password (send email)
  static async resetPassword(email: string): Promise<void> {
    const user = await db.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real application, you would send this token via email
    // For now, we'll just log it (remove this in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    // TODO: Send email with reset link
    // Example: await sendResetEmail(email, resetToken);
  }

  // Change password with reset token
  static async changePasswordWithToken(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded || decoded.type !== 'reset') {
        throw new Error('Invalid reset token');
      }

      const user = await db.getUserById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update password
      await db.updateUserPassword(decoded.id, passwordHash);
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  // Update user password
  static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await this.comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password
    await db.updateUserPassword(userId, passwordHash);
  }
}

// Export singleton instance
export const mysqlAuth = new MySQLAuth();
