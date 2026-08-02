const { createClerkClient, verifyToken } = require('@clerk/backend');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function getPrimaryEmail(user) {
  const list = user.emailAddresses || [];
  const primary = list.find((e) => e.id === user.primaryEmailAddressId) || list[0];
  return primary ? (primary.emailAddress || '').toLowerCase() : '';
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
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
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  try {
    const list = await clerkClient.users.getUserList({ limit: 100 });
    const users = list.data || list;

    const mapped = (users || []).map((u) => {
      const email = getPrimaryEmail(u);
      const meta = u.publicMetadata || {};
      return {
        id: u.id,
        email: email,
        subscriptionStatus: meta.subscriptionStatus || 'inactive',
        subscriptionExpiresAt: meta.subscriptionExpiresAt || null,
        lastSignInAt: u.lastSignInAt || null,
        createdAt: u.createdAt || null
      };
    });

    mapped.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    res.status(200).json({ users: mapped });
  } catch (err) {
    console.error('Error listando usuarios:', err);
    res.status(500).json({ error: 'Error interno listando usuarios' });
  }
};
