import React, { forwardRef, useImperativeHandle } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const StripeCheckout = forwardRef(({ amount, onPaymentSuccess, onPaymentError }, ref) => {
  const stripe = useStripe();
  const elements = useElements();

  useImperativeHandle(ref, () => ({
    processPayment: async (clientSecret, billingDetails) => {
      if (!stripe || !elements) {
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: billingDetails.fullName,
            email: billingDetails.email,
            address: {
              line1: billingDetails.address,
              city: billingDetails.city,
              state: billingDetails.state,
              postal_code: billingDetails.zipCode,
              country: billingDetails.country,
            }
          }
        }
      });

      if (result.error) {
        onPaymentError(result.error.message);
      } else {
        onPaymentSuccess();
      }
    }
  }));

  return (
    <div>
      <CardElement />
    </div>
  );
});

export default StripeCheckout;
