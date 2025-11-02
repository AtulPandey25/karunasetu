import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "@/components/Layout";
import Gallery from "./pages/Gallery";
import Admin from "./pages/Admin";
import Celebration from "./pages/Celebration";
import CelebrationDetail from "./pages/CelebrationDetail";
import Cart from "./pages/Cart";
import PaymentPage from "./pages/Payment";
import OrderConfirmationPage from "./pages/OrderConfirmation";

const queryClient = new QueryClient();

import { CartProvider } from "./context/CartContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="admin" element={<Admin />} />
              <Route path="celebration" element={<Celebration />} />
              <Route path="celebration/:id" element={<CelebrationDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="payment/:id" element={<PaymentPage />} />
              <Route path="order-confirmation/:id" element={<OrderConfirmationPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
