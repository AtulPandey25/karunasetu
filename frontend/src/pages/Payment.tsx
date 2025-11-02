
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: orderData, isLoading: orderIsLoading } = useQuery({
    queryKey: ["orders", id],
    queryFn: () => apiClient.get(`/orders/${id}`),
    enabled: !!id,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${id}/confirm`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Payment confirmation failed");
      }
      return response.json();
    },
    onSuccess: () => {
      navigate(`/order-confirmation/${id}`);
    },
  });

  const order = orderData?.data.order;

  if (orderIsLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-3/4 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Complete Your Payment</h1>
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold text-2xl">₹{order.totalAmount.toFixed(2)}</span>
            </div>
            <Button
              onClick={() => confirmPaymentMutation.mutate()}
              disabled={confirmPaymentMutation.isPending}
              className="w-full"
            >
              {confirmPaymentMutation.isPending ? "Processing..." : "Pay Now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;
