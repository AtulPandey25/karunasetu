import { Router, RequestHandler, json } from "express";
import { connectMongo } from "../db";
import { OrderModel } from "../models/Order";

const router = Router();
router.use(json());

router.post("/", (async (req, res) => {
  const { customerName, customerEmail, customerPhone, items } = req.body as {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }[];
  };

  if (!customerName || !customerEmail || !customerPhone || !items?.length) {
    return res.status(400).json({
      error: "customerName, customerEmail, customerPhone, and items required",
    });
  }

  const { connected } = await connectMongo();
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await OrderModel.create({
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalAmount,
      status: "pending",
    });

    const paymentUrl = `/payment/${order._id}`;

    res.status(201).json({ order, paymentUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create order" });
  }
}) as RequestHandler);

router.get("/:id", (async (req, res) => {
  const { id } = req.params;
  const { connected } = await connectMongo();
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const order = await OrderModel.findById(id).lean();
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch order" });
  }
}) as RequestHandler);

router.post("/:id/confirm", (async (req, res) => {
  const { id } = req.params;
  const { connected } = await connectMongo();
  if (!connected) {
    return res.status(503).json({ error: "Database not configured" });
  }

  try {
    const order = await OrderModel.findByIdAndUpdate(
      id,
      { status: "paid" },
      { new: true }
    ).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Here you would typically trigger things like sending a confirmation email.
    // For now, we just confirm the payment.

    res.json({ order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to confirm order payment" });
  }
}) as RequestHandler);

export default router;
