import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  rol: string;
  empresaClienteId?: string;
  empresaTransportistaId?: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRol?: string;
      empresaClienteId?: string;
      empresaTransportistaId?: string;
      jwtPayload?: JWTPayload;
    }
  }
}

/**
 * Verify JWT token from Authorization header
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Verify user is still active in DB
    const result = await query(
      `SELECT id, rol, empresa_cliente_id, empresa_transportista_id, estado 
       FROM usuarios WHERE id = $1`,
      [payload.userId]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }
    if (user.estado !== 'activo') {
      res.status(403).json({ error: 'Usuario inactivo' });
      return;
    }

    req.userId = user.id;
    req.userRol = user.rol;
    req.empresaClienteId = user.empresa_cliente_id;
    req.empresaTransportistaId = user.empresa_transportista_id;
    req.jwtPayload = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido' });
    } else {
      res.status(500).json({ error: 'Error verificando autenticación' });
    }
  }
}

/**
 * Middleware: require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRol || !roles.includes(req.userRol)) {
      res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`
      });
      return;
    }
    next();
  };
}

/**
 * Generate JWT token pair (access + refresh)
 */
export function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
  const refreshToken = jwt.sign(
    { userId: payload.userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
}
