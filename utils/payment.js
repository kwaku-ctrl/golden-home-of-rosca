const axios = require('axios');

exports.initializePaystackPayment = async (email, amount) => {
  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    { email, amount },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    }
  );
  return response.data;
};

exports.verifyPaystackPayment = async reference => {
  const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
    }
  });
  return response.data;
};
