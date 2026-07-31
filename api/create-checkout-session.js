const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/backend');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

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

  let userId;
  try {
    const verified = await clerkClient.verifyToken(token);
    userId = verified.sub;
  } catch (err) {
    res.status(401).json({ error: 'Sesión inválida' });
    return;
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { clerkUserId: userId }
      },
      client_reference_id: userId,
      metadata: { clerkUserId: userId },
      success_url: `${origin}/suscripcion.html?resultado=exito`,
      cancel_url: `${origin}/suscripcion.html?resultado=cancelado`
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Error creando sesión de checkout:', err);
    res.status(500).json({ error: 'No se pudo iniciar el pago' });
  }
};
