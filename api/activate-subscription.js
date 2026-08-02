const { createClerkClient } = require('@clerk/backend');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Falta el token de sesión' });
    return;
  }

  let callerId;
  try {
    const verified = await clerkClient.verifyToken(token);
    callerId = verified.sub;
  } catch (err) {
    res.status(401).json({ error: 'Sesión inválida' });
    return;
  }

  let caller;
  try {
    caller = await clerkClient.users.getUser(callerId);
  } catch (err) {
    res.status(401).json({ error: 'No se pudo verificar el usuario' });
    return;
  }

  const callerEmail = (caller.primaryEmailAddress && caller.primaryEmailAddress.emailAddress || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(callerEmail)) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  const targetEmail = (req.body && req.body.email || '').trim().toLowerCase();
  if (!targetEmail) {
    res.status(400).json({ error: 'Falta el email del usuario a activar' });
    return;
  }

  try {
    const list = await clerkClient.users.getUserList({ emailAddress: [targetEmail] });
    const users = list.data || list;
    if (!users || users.length === 0) {
      res.status(404).json({ error: 'No existe una cuenta con ese email' });
      return;
    }

    const targetUser = users[0];
    const expiresAt = Date.now() + THIRTY_DAYS_MS;

    await clerkClient.users.updateUserMetadata(targetUser.id, {
      publicMetadata: {
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresAt
      }
    });

    res.status(200).json({ ok: true, expiresAt });
  } catch (err) {
    console.error('Error activando suscripción:', err);
    res.status(500).json({ error: 'Error interno activando la suscripción' });
  }
};
