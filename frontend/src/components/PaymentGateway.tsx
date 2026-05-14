import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe with the provided test key
const stripePromise = loadStripe('pk_test_51R5KV0EIWCxGuuh7Fk6pJ4f6LU93QC2ESUnKUXqdPFtelf2n8mvwlcqM56IEK3i0JeD9hB4onBkIPEXzNfft7jPn00idRshu3M');

interface CheckoutFormProps {
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      setProcessing(false);
      return;
    }

    try {
      // In a real production app, you would call your backend here
      // const response = await fetch('/api/create-payment-intent', { ... });

      // For demonstration purposes, we'll simulate a successful payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate success
      onSuccess({ status: 'succeeded', amount });
    } catch (err: any) {
      onError(err.message || 'An error occurred during payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-md p-4 bg-white">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-100"
      >
        {processing ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}`}
      </button>
    </form>
  );
};

export const PaymentGateway: React.FC<CheckoutFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};
