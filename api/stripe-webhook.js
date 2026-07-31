const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/backend');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const config = {
  api: { bodyParser: false }
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function setSubscriptionStatus(clerkUserId, status) {
  if (!clerkUserId) return;
  await clerkClient.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { subscriptionStatus: status }
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Firma de webhook inválida:', err.message);
    res.status(400).json({ error: 'Firma inválida' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const clerkUserId = session.metadata && session.metadata.clerkUserId;
        await setSubscriptionStatus(clerkUserId, 'active');
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const clerkUserId = subscription.metadata && subscription.metadata.clerkUserId;
        const activeStatuses = ['trialing', 'active'];
        await setSubscriptionStatus(clerkUserId, activeStatuses.includes(subscription.status) ? 'active' : 'inactive');
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const clerkUserId = subscription.metadata && subscription.metadata.clerkUserId;
        await setSubscriptionStatus(clerkUserId, 'inactive');
        break;
      }
      default:
        break;
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports.config = config;
