import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { AuthTokenPort, TokenPayload } from '../../domain/ports/infrastructure.port.js';
import { envConfig } from '../../config/environment/env-config.js';
import { UnauthorizedError } from '../../shared/errors/domain-errors.js';

export class JwtAuthTokenAdapter implements AuthTokenPort {
  sign(payload: TokenPayload): string {
    return jwt.sign(payload, envConfig.JWT_SECRET, { expiresIn: envConfig.JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  verify(token: string): TokenPayload {
    try {
      return jwt.verify(token, envConfig.JWT_SECRET) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
