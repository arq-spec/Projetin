import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'frello_jwt_secret_secure_key_135792468';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    perfil: string;
    nome: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): any {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token de autenticação não fornecido ou inválido.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      perfil: decoded.perfil,
      nome: decoded.nome
    };
    next();
  } catch (error) {
    console.error('[AuthMiddleware] JWT Verification failed:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token de autenticação expirado ou inválido.'
    });
  }
}
