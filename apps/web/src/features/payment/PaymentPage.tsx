import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { ErrorState } from "../../components/ErrorState.js";
import { getErrorMessage } from "../../lib/errors.js";
import { getBooking } from "../booking/bookingApi.js";
import { createPaymentIntent } from "./paymentApi.js";
import { stripePromise } from "./stripeClient.js";

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/bookings/mine` },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      <Button
        type="submit"
        variant="contained"
        disabled={!stripe || submitting}
        sx={{ mt: 2 }}
      >
        {submitting ? "Processing…" : "Pay now"}
      </Button>
    </Box>
  );
}

export function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [intentError, setIntentError] = useState<unknown>(null);

  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (!bookingId || !booking) return;
    if (booking.status !== "pending_payment") return;
    setIntentError(null);
    createPaymentIntent(bookingId)
      .then((result) => {
        setClientSecret(result.clientSecret);
        setAmount(result.amount);
      })
      .catch((err: unknown) => setIntentError(err));
  }, [bookingId, booking]);

  if (isLoading) return <CircularProgress sx={{ m: 4 }} />;
  if (isError) {
    return (
      <Box maxWidth={500} mx="auto" mt={4} px={2}>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Box>
    );
  }
  if (!booking) return <Typography m={4}>Booking not found.</Typography>;

  if (booking.status !== "pending_payment") {
    return (
      <Box maxWidth={500} mx="auto" mt={4} px={2}>
        <Alert severity="info">
          This booking is already {booking.status}.{" "}
          <Button onClick={() => navigate("/bookings/mine")}>
            View my bookings
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={500} mx="auto" mt={4} px={2}>
      <Typography variant="h5" mb={2}>
        Checkout
      </Typography>
      <Typography mb={2}>Amount: ₹{amount ?? booking.totalAmount}</Typography>
      {intentError !== null && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(
            intentError,
            "Could not start checkout. Please try again.",
          )}
        </Alert>
      )}
      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
      ) : (
        !intentError && <CircularProgress />
      )}
    </Box>
  );
}
