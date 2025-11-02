
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const OrderConfirmationPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: orderData, isLoading: orderIsLoading } = useQuery({
    queryKey: ["orders", id],
    queryFn: () => apiClient.get(`/orders/${id}`),
    enabled: !!id,
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
            <Skeleton className="h-6 w-3/4" />
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
      <div className="max-w-2xl mx-auto">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">✓</div>
            <CardTitle className="text-2xl text-green-800">Order Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-green-700">
            <p className="mb-2">Thank you for your purchase, {order.customerName}!</p>
            <p className="mb-4">Your order ID is <span className="font-semibold">{order._id}</span>.</p>
            <p className="text-sm">You will receive a confirmation email at {order.customerEmail} shortly.</p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/celebrations">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
