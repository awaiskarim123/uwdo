
import jwt, {
    Secret,
    SignOptions,
    JwtPayload,
  } from 'jsonwebtoken';
  import { randomBytes } from 'crypto';
  

  
  export interface AccessTokenPayload extends JwtPayload {
    userId: string;
    email: string;
    role: string;
    type: 'access';
  }
  
 
  
  function getAccessTokenSecret(): Secret {
    const secret = process.env.JWT_ACCESS_SECRET;
  
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }
  
    return secret;
  }
  
  function getAccessTokenExpiresIn(): SignOptions['expiresIn'] {
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
  
    // Default must be a VALID jwt StringValue
    if (!expiresIn) {
      return '1h';
    }
  
    // Optional: runtime safety
    if (!/^\d+[smhd]$/.test(expiresIn)) {
      throw new Error(
        'JWT_ACCESS_EXPIRES_IN must be in format: 10s | 5m | 1h | 7d'
      );
    }
  
    return expiresIn as SignOptions['expiresIn'];
  }
  

  
  /**
   * Generate JWT access token
   */
  export function generateAccessToken(
    userId: string,
    email: string,
    role: string
  ): string {
    const payload: AccessTokenPayload = {
      userId,
      email,
      role,
      type: 'access',
    };
  
    const options: SignOptions = {
      expiresIn: getAccessTokenExpiresIn(),
    };
  
    return jwt.sign(payload, getAccessTokenSecret(), options);
  }
  
  /**
   * Generate refresh token (secure random string)
   */
  export function generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }
  
  /**
   * Calculate refresh token expiration date
   */
  export function getRefreshTokenExpiration(): Date {
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
    const date = new Date();
  
    const match = expiresIn.match(/^(\d+)([smhd])$/);
  
    if (!match) {
      date.setDate(date.getDate() + 7);
      return date;
    }
  
    const value = Number(match[1]);
    const unit = match[2];
  
    switch (unit) {
      case 'd':
        date.setDate(date.getDate() + value);
        break;
      case 'h':
        date.setHours(date.getHours() + value);
        break;
      case 'm':
        date.setMinutes(date.getMinutes() + value);
        break;
      case 's':
        date.setSeconds(date.getSeconds() + value);
        break;
    }
  
    return date;
  }
  

  
  /**
   * Verify access token
   */
  export function verifyAccessToken(
    token: string
  ): AccessTokenPayload | null {
    try {
      const decoded = jwt.verify(
        token,
        getAccessTokenSecret()
      ) as AccessTokenPayload;
  
      if (decoded.type !== 'access') {
        return null;
      }
  
      return decoded;
    } catch {
      return null;
    }
  }
  