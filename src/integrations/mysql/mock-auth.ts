// Mock authentication for development
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
  static async hashPassword(password: string): Promise<string> {
    return 'mock-hash';
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return password === 'admin123';
  }

  static generateToken(user: User): string {
    return 'mock-token';
  }

  static verifyToken(token: string): any {
    return { id: 'mock-user-id', email: 'admin@sistema.com', role: 'admin' };
  }

  static async signUp(userData: any): Promise<AuthResult> {
    const user: User = {
      id: 'mock-user-id',
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role || 'agent',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    return { user, token: 'mock-token' };
  }

  static async signIn(email: string, password: string): Promise<AuthResult> {
    if (email === 'admin@sistema.com' && password === 'admin123') {
      const user: User = {
        id: 'mock-user-id',
        email: 'admin@sistema.com',
        full_name: 'Administrador del Sistema',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      return { user, token: 'mock-token' };
    }
    throw new Error('Invalid email or password');
  }

  static async getUserFromToken(token: string): Promise<User | null> {
    if (token === 'mock-token') {
      return {
        id: 'mock-user-id',
        email: 'admin@sistema.com',
        full_name: 'Administrador del Sistema',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
    }
    return null;
  }

  static async resetPassword(email: string): Promise<void> {
    console.log(`Password reset requested for: ${email}`);
  }

  static async changePasswordWithToken(token: string, newPassword: string): Promise<void> {
    console.log('Password changed with token');
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    console.log('Password updated');
  }
}

export const mysqlAuth = new MySQLAuth();
