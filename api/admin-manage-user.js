const { createClerkClient, verifyToken } = require('@clerk/backend');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const VALID_ACTIONS = ['activate', 'extend', 'revoke'];

function getPrimaryEmail(user) {
  const list = user.emailAddresses || [];
  const primary = list.find((e) => e.id === user.primaryEmailAddressId) || list[0];
  return primary ? (primary.emailAddress || '').toLowerCase() : '';
}

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
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    callerId = verified.sub;
  } catch (err) {
    console.error('Error verificando token:', err);
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

  const callerEmail = getPrimaryEmail(caller);
  if (!ADMIN_EMAILS.includes(callerEmail)) {
    res.status(403).json({
      error: 'No autorizado',
      debugCallerEmail: callerEmail,
      debugAdminEmailsCount: ADMIN_EMAILS.length,
      debugAdminEmailsRaw: process.env.ADMIN_EMAILS || null
    });
    return;
  }

  const targetEmail = (req.body && req.body.email || '').trim().toLowerCase();
  const action = (req.body && req.body.action || '').trim();

  if (!targetEmail) {
    res.status(400).json({ error: 'Falta el email del usuario' });
    return;
  }
  if (!VALID_ACTIONS.includes(action)) {
    res.status(400).json({ error: 'Acción inválida' });
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
    const existingMeta = targetUser.publicMetadata || {};

    let subscriptionStatus;
    let subscriptionExpiresAt = existingMeta.subscriptionExpiresAt || null;

    if (action === 'activate') {
      subscriptionStatus = 'active';
      subscriptionExpiresAt = Date.now() + THIRTY_DAYS_MS;
    } else if (action === 'extend') {
      subscriptionStatus = 'active';
      const currentExpiresAt = existingMeta.subscriptionExpiresAt || 0;
      const base = (currentExpiresAt && currentExpiresAt > Date.now()) ? currentExpiresAt : Date.now();
      subscriptionExpiresAt = base + THIRTY_DAYS_MS;
    } else if (action === 'revoke') {
      subscriptionStatus = 'inactive';
      // subscriptionExpiresAt se deja como está
    }

    await clerkClient.users.updateUserMetadata(targetUser.id, {
      publicMetadata: {
        ...existingMeta,
        subscriptionStatus: subscriptionStatus,
        subscriptionExpiresAt: subscriptionExpiresAt
      }
    });

    res.status(200).json({ ok: true, subscriptionStatus, subscriptionExpiresAt });
  } catch (err) {
    console.error('Error administrando usuario:', err);
    res.status(500).json({ error: 'Error interno administrando el usuario' });
  }
};
