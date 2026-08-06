import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from './user.schema';
import { connectToDatabase } from './db';
import crypto from 'crypto';

// Use a secure JWT Secret from environment variables or a fallback (for dev only)
const JWT_SECRET = process.env.JWT_SECRET || 'frello_jwt_secret_secure_key_135792468';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registers a new user with hashed password (handled automatically by UserSchema post-hook)
   */
  async register(req: Request, res: Response): Promise<any> {
    try {
      await connectToDatabase();
      const { nome, email, username, cpf, password, perfil, freelancerId } = req.body;

      // 1. Validation
      if (!nome || !email || !username || !cpf || !password || !perfil) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Todos os campos obrigatórios devem ser preenchidos.' 
        });
      }

      // 2. Check duplicate email / username / cpf
      const existingUser = await UserModel.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }, { cpf }]
      }).exec();

      if (existingUser) {
        let field = 'Cadastro';
        if (existingUser.email === email.toLowerCase()) field = 'E-mail';
        else if (existingUser.username === username.toLowerCase()) field = 'Nome de usuário';
        else if (existingUser.cpf === cpf) field = 'CPF';

        return res.status(409).json({ 
          error: 'User already exists',
          message: `${field} já está em uso.` 
        });
      }

      // 3. Create user (Schema's pre-save hook automatically hashes password)
      const newUser = new UserModel({
        id: crypto.randomUUID(),
        nome,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        cpf,
        password,
        perfil,
        freelancerId,
        statusAprovacao: 'Aprovado' // Default approved or could be 'Pendente' depending on profile
      });

      await newUser.save();

      // Convert to clean JSON
      const userJSON = newUser.toJSON();

      // 4. Generate JWT
      const token = jwt.sign(
        { 
          id: userJSON.id, 
          email: userJSON.email, 
          perfil: userJSON.perfil,
          nome: userJSON.nome
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION } as any
      );

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        token,
        user: userJSON
      });

    } catch (error: any) {
      console.error('[AuthController] Registration error:', error);
      return res.status(500).json({
        error: 'Registration failed',
        message: 'Falha interna ao registrar o usuário.',
        details: error.message
      });
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user and returns JWT
   */
  async login(req: Request, res: Response): Promise<any> {
    try {
      await connectToDatabase();
      const { loginIdentifier, password } = req.body; // Can be username, email or cpf

      if (!loginIdentifier || !password) {
        return res.status(400).json({ 
          error: 'Credentials required',
          message: 'Usuário e senha são obrigatórios.' 
        });
      }

      const identifier = loginIdentifier.toLowerCase().trim();

      // 1. Find user by email, username, or CPF
      const user = await UserModel.findOne({
        $or: [
          { email: identifier },
          { username: identifier },
          { cpf: identifier.replace(/\D/g, '') } // strip non-digits for CPF comparison
        ]
      }).select('+password').exec(); // Include password explicitly if select: false was set

      if (!user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Credenciais inválidas ou usuário não cadastrado.' 
        });
      }

      if (user.statusAprovacao === 'Pendente') {
        return res.status(403).json({
          error: 'Pending approval',
          message: 'Sua conta ainda está pendente de aprovação pelos administradores.'
        });
      }

      if (user.statusAprovacao === 'Rejeitado') {
        return res.status(403).json({
          error: 'Account rejected',
          message: 'Sua solicitação de cadastro foi rejeitada.'
        });
      }

      // 2. Compare passwords
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Usuário ou senha incorretos.' 
        });
      }

      const userJSON = user.toJSON();

      // 3. Generate JWT
      const token = jwt.sign(
        { 
          id: userJSON.id, 
          email: userJSON.email, 
          perfil: userJSON.perfil,
          nome: userJSON.nome
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION } as any
      );

      return res.status(200).json({
        message: 'Login realizado com sucesso!',
        token,
        user: userJSON
      });

    } catch (error: any) {
      console.error('[AuthController] Login error:', error);
      return res.status(500).json({
        error: 'Login failed',
        message: 'Falha interna ao realizar o login.',
        details: error.message
      });
    }
  }

  /**
   * GET /api/auth/me
   * Retrieves profile of current logged-in user (requires auth middleware)
   */
  async getMe(req: any, res: Response): Promise<any> {
    try {
      await connectToDatabase();
      const userId = req.user?.id; // Supplied by auth middleware

      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Sessão inválida.' 
        });
      }

      const user = await UserModel.findOne({ id: userId }).exec();
      if (!user) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Usuário não encontrado.' 
        });
      }

      return res.status(200).json({ user: user.toJSON() });
    } catch (error: any) {
      console.error('[AuthController] GetMe error:', error);
      return res.status(500).json({
        error: 'Internal error',
        message: 'Erro ao carregar os dados do perfil.',
        details: error.message
      });
    }
  }
}
