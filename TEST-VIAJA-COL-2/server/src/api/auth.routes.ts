import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool';
import { authMiddleware, generateTokens, JWTPayload } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { accessToken, refreshToken, user }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }

    // Find user
    const result = await query(
      `SELECT u.id, u.email, u.nombre, u.password_hash, u.rol, u.estado,
              u.empresa_cliente_id, u.empresa_transportista_id
       FROM usuarios u
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    if (user.estado !== 'activo') {
      res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador.' });
      return;
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    // Generate tokens
    const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      rol: user.rol,
      empresaClienteId: user.empresa_cliente_id,
      empresaTransportistaId: user.empresa_transportista_id,
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Log access
    await query(
      `INSERT INTO log_auditoria (usuario_id, accion, tabla_afectada) VALUES ($1, $2, $3)`,
      [user.id, 'LOGIN', 'usuarios']
    ).catch(() => {}); // fire and forget

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        empresaClienteId: user.empresa_cliente_id,
        empresaTransportistaId: user.empresa_transportista_id,
      },
    });
  } catch (error) {
    console.error('[Auth] Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 * Returns: { accessToken }
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token requerido' });
      return;
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string };

    const result = await query(
      `SELECT id, rol, empresa_cliente_id, empresa_transportista_id, estado
       FROM usuarios WHERE id = $1`,
      [payload.userId]
    );

    const user = result.rows[0];
    if (!user || user.estado !== 'activo') {
      res.status(401).json({ error: 'Usuario no válido' });
      return;
    }

    const { accessToken } = generateTokens({
      userId: user.id,
      rol: user.rol,
      empresaClienteId: user.empresa_cliente_id,
      empresaTransportistaId: user.empresa_transportista_id,
    });

    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido o expirado' });
  }
});

/**
 * GET /api/auth/me
 * Returns current user info
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, nombre, rol, estado, empresa_cliente_id, empresa_transportista_id, created_at
       FROM usuarios WHERE id = $1`,
      [req.userId]
    );
    res.json({ data: result.rows[0] });
  } catch {
    res.status(500).json({ error: 'Error obteniendo perfil' });
  }
});

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 */
router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'Contraseña nueva debe tener mínimo 8 caracteres' });
      return;
    }

    const result = await query('SELECT password_hash FROM usuarios WHERE id = $1', [req.userId]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Contraseña actual incorrecta' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.userId]);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch {
    res.status(500).json({ error: 'Error actualizando contraseña' });
  }
});

/**
 * POST /api/auth/register (admin only - create new users)
 */
router.post('/register', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.userRol !== 'admin_transportista') {
      res.status(403).json({ error: 'Solo el admin puede crear usuarios' });
      return;
    }

    const { email, password, nombre, rol, empresa_cliente_id, empresa_transportista_id } = req.body;

    if (!email || !password || !nombre || !rol) {
      res.status(400).json({ error: 'email, password, nombre y rol son requeridos' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
      return;
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Ya existe un usuario con ese email' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO usuarios (email, password_hash, nombre, rol, empresa_cliente_id, empresa_transportista_id, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'activo')
       RETURNING id, email, nombre, rol, estado, created_at`,
      [email.toLowerCase(), passwordHash, nombre, rol, empresa_cliente_id || null, empresa_transportista_id || null]
    );

    res.status(201).json({ data: result.rows[0], message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('[Auth] Error en registro:', error);
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

export default router;
