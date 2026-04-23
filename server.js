const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51TPMyfGqPAmUeJ2Pb4HKkMyb1AAqjUYEZulodSu0yWA4g9ncq4NrjScoG5xsfzf2w3g9NPmvb2AZ8FrhSrx4GP8K00jBkwwCg6'); // TODO: Replace with env variable

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { serviceId, providerName, price } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Booking with ${providerName}`,
            },
            unit_amount: price * 100, // Stripe expects amount in cents/paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
