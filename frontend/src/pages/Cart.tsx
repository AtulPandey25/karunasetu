import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function Cart() {
  const { cart, removeItem, updateQuantity, clearCart, getTotal, isLoaded } =
    useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: cart.map((item) => ({
            productId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Checkout failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
  });

  if (!isLoaded) {
    return (
      <div className="container py-12 text-center">
        <p className="text-slate-600">Loading cart...</p>
      </div>
    );
  }

  if (orderConfirmed) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-green-700 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-green-600 mb-4">
            Thank you for your order. We will contact you soon.
          </p>
          <p className="text-sm text-slate-600">
            Redirecting to celebrations...
          </p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Cart Empty</h1>
          <p className="text-slate-600 mb-6">
            Add some products to your cart to get started!
          </p>
          <Button onClick={() => navigate("/celebration")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg border border-slate-200 p-4 flex gap-4"
              >
                {/* Image */}
                {item.imageUrl && (
                  <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <p className="text-blue-600 font-semibold">₹{item.price}</p>

                  {/* Quantity Control */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item._id || "",
                          Math.max(1, item.quantity - 1)
                        )
                      }
                      className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item._id || "", item.quantity + 1)
                      }
                      className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-100"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item._id || "")}
                      className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    ₹{item.price * item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 h-fit sticky top-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Checkout
            </h2>

            {/* Order Summary */}
            <div className="bg-slate-50 rounded p-4 mb-4">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">₹{getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-slate-600">Shipping:</span>
                <span className="font-semibold">Free</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between">
                <span className="font-bold">Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  ₹{getTotal().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                checkoutMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerName: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={formData.customerEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerEmail: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerPhone: e.target.value,
                    }))
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? "Processing..." : "Complete Order"}
              </Button>
            </form>

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => navigate("/celebration")}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
