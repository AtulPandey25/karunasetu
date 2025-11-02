import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Donor, GetDonorsResponse, GetGalleryResponse } from "../types/api";
import { Link } from "react-router-dom";
import { apiGet } from "@/lib/api";
import EventBanner from "@/components/EventBanner";

export default function Index() {
  const { data } = useQuery<GetDonorsResponse>({
    queryKey: ["donors"],
    queryFn: async () => apiGet("/api/donors", { donors: [] }),
  });
  const donors = (data?.donors ?? []) as Donor[];

  const membersQuery = useQuery<{ members: any[] }>({
    queryKey: ["members"],
    queryFn: async () => apiGet("/api/members", { members: [] }),
  });
  const members = membersQuery.data?.members || [];

  // Donation form state
  const options = [50, 100, 500, 1000];
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("one-time");
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    // load Razorpay script
    if (
      !document.querySelector(
        "script[src='https://checkout.razorpay.com/v1/checkout.js']",
      )
    ) {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const displayAmount = customAmount
    ? Number(customAmount)
    : selectedAmount || 0;

  function selectOption(amount: number) {
    setSelectedAmount(amount);
    setCustomAmount("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayAmount || displayAmount <= 0) {
      alert("Please select or enter a donation amount");
      return;
    }

    const amountInPaise = Math.round(displayAmount * 100);
    const RAZOR_KEY =
      import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_uNG8QzQSOzEDrF";

    const optionsRzp: any = {
      key: RAZOR_KEY,
      amount: amountInPaise,
      currency: "INR",
      name: "KarunaSetu Foundation",
      description: "Donation for social causes",
      image: "https://via.placeholder.com/150x150?text=KS",
      handler: function (response: any) {
        alert(
          "Payment successful! Payment ID: " + response.razorpay_payment_id,
        );
        // reset form
        setSelectedAmount(null);
        setCustomAmount("");
        setFrequency("one-time");
        setPaymentMethod("credit-card");
        setName("");
        setEmail("");
        setPhone("");
      },
      prefill: { name, email, contact: phone },
      notes: { address: "KarunaSetu Foundation Office" },
      theme: { color: "hsl(var(--primary))" },
    };

    // @ts-ignore
    const rzp = new window.Razorpay(optionsRzp);
    rzp.open();
    rzp.on("payment.failed", function (response: any) {
      alert(
        "Payment failed. Please try again. Error: " +
          (response.error?.description || "Unknown"),
      );
    });
  }

  return (
    <div className="">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white">
        <div className="container grid gap-10 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              KarunaSetu Foundation
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Bridging compassion through education, healthcare, and community
              development initiatives across India.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#donate"
                className="inline-flex items-center rounded-md bg-primary px-5 py-3 text-primary-foreground shadow hover:opacity-90"
              >
                Donate Now
              </a>
              <Link
                to="/gallery"
                className="inline-flex items-center rounded-md border px-5 py-3 hover:bg-muted"
              >
                View Gallery
              </Link>
            </div>
          </div>
          <div className="relative">
            <HeroSlideshow />
          </div>
        </div>
      </section>

      {/* Event Banner */}
      <EventBanner />

      {/* About */}
      <section id="about" className="container py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">About Us</h2>
            <p className="mt-4 text-muted-foreground">
              Founded with a vision to empower communities, we focus on
              sustainable impact and transparent operations. Our volunteers and
              partners enable us to reach those who need it most.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Food Campaign for Anmals and children</li>
              <li>• Funding for Education of underprevilleged Children</li>
              <li>• Initiating a plantation drive for a sustainable future</li>
            </ul>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <StatCard value="14+" label="Months of Service" />
            <StatCard value="30+" label="Animals Feeded" />
            <StatCard value="1000+" label="Lives Impacted" />
            <StatCard value="200+" label="Trees Planted" />
          </div>
        </div>
      </section>

      {/* Donors */}
      <section className="bg-muted/40">
        <div className="container py-16 md:py-24">
          <h2 className="text-3xl font-bold text-center">
            Our Generous Donors
          </h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            The backbone of our initiatives.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {donors.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground">
                No donors yet. Add some in the Admin panel.
              </div>
            )}
            {donors.map((d) => (
              <div
                key={d._id}
                className="rounded-lg border bg-card p-6 shadow-sm text-center"
              >
                {d.logoUrl ? (
                  <img
                    src={d.logoUrl}
                    alt={d.name}
                    className="h-24 w-24 rounded-full mx-auto mb-4 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center mb-4 text-primary font-semibold">
                    {d.name.charAt(0)}
                  </div>
                )}
                <div className="font-semibold">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.tier} Donor{" "}
                  {d.donatedAmount ? `• ₹${d.donatedAmount}` : ""}{" "}
                  {d.donatedCommodity ? `• ${d.donatedCommodity}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Members */}
      <section id="members" className="container py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center">Our Team & Partners</h2>
        <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
          Founders and partners driving our mission.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {members.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">
              No members yet. Add them via Admin.
            </div>
          )}
          {members.map((m) => (
            <div
              key={m._id}
              className="rounded-lg border bg-card p-6 shadow-sm text-center"
            >
              {m.photoUrl ? (
                <img
                  src={m.photoUrl}
                  className="h-24 w-24 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary/10 mx-auto mb-4 grid place-items-center">
                  {m.name.charAt(0)}
                </div>
              )}
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm text-muted-foreground">{m.role}</div>
              {m.bio && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {m.bio}
                </div>
              )}
              {(m.instaId || m.email || m.contact) && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
                  {m.instaId && (
                    <a
                      href={`https://instagram.com/${m.instaId.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-pink-600 hover:bg-pink-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="currentColor"
                      >
                        <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm9 2a1 1 0 100 2 1 1 0 000-2zM12 7a5 5 0 100 10 5 5 0 000-10z" />
                      </svg>
                      @{m.instaId.replace(/^@/, "")}
                    </a>
                  )}
                  {m.email && (
                    <a
                      href={`mailto:${m.email}`}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-blue-600 hover:bg-blue-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="currentColor"
                      >
                        <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 2l-8 5L4 6h16zm0 12H4V8l8 5 8-5v10z" />
                      </svg>
                      {m.email}
                    </a>
                  )}
                  {m.contact && (
                    <a
                      href={`tel:${m.contact}`}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-green-600 hover:bg-green-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="currentColor"
                      >
                        <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.42 22 2 13.58 2 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
                      </svg>
                      {m.contact}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Donate */}
      <section id="donate" className="container py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Support Our Work</h2>
            <p className="mt-4 text-muted-foreground">
              Your contribution fuels education, healthcare, and welfare
              programs. You can donate once or set up recurring contributions
              via your preferred method.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {options.map((amt) => (
                <button
                  key={amt}
                  onClick={() => selectOption(amt)}
                  className={`donation-option rounded-lg p-4 text-center border ${selectedAmount === amt ? "selected border-indigo-600 bg-indigo-50" : ""}`}
                  data-amount={amt}
                >
                  <div className="text-2xl font-bold text-indigo-600">
                    ₹{amt}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {amt === 50
                      ? "Feeds a child for a day"
                      : amt === 500
                        ? "School supplies for 2 kids"
                        : amt === 1000
                          ? "Medical care for a family"
                          : "Vaccination for 1 street dog"}
                  </div>
                </button>
              ))}

              <div className="col-span-full mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter your amount (₹)
                </label>
                <input
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  type="number"
                  id="custom-amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter amount"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Frequency
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFrequency("one-time");
                    }}
                    className={`frequency-btn py-2 px-4 rounded-lg ${frequency === "one-time" ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-700"}`}
                    data-frequency="one-time"
                  >
                    One Time
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFrequency("monthly");
                    }}
                    className={`frequency-btn py-2 px-4 rounded-lg ${frequency === "monthly" ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-700"}`}
                    data-frequency="monthly"
                  >
                    Monthly
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFrequency("yearly");
                    }}
                    className={`frequency-btn py-2 px-4 rounded-lg ${frequency === "yearly" ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-700"}`}
                    data-frequency="yearly"
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Complete Your Donation
            </h3>

            <div className="mb-6 bg-indigo-50 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Donation Amount</span>
                <span className="font-medium" id="display-amount">
                  ₹{displayAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frequency</span>
                <span className="font-medium" id="display-frequency">
                  {frequency === "one-time"
                    ? "One Time"
                    : frequency === "monthly"
                      ? "Monthly"
                      : "Yearly"}
                </span>
              </div>
            </div>

            <form id="donation-form" onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="credit-card"
                      name="payment-method"
                      type="radio"
                      checked={paymentMethod === "credit-card"}
                      onChange={() => setPaymentMethod("credit-card")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label
                      htmlFor="credit-card"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      Credit/Debit Card
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="upi"
                      name="payment-method"
                      type="radio"
                      checked={paymentMethod === "upi"}
                      onChange={() => setPaymentMethod("upi")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label
                      htmlFor="upi"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      UPI
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="net-banking"
                      name="payment-method"
                      type="radio"
                      checked={paymentMethod === "net-banking"}
                      onChange={() => setPaymentMethod("net-banking")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label
                      htmlFor="net-banking"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      Net Banking
                    </label>
                  </div>
                </div>
              </div>

              {paymentMethod === "credit-card" && (
                <div id="credit-card-fields">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="card-number"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Card Number
                      </label>
                      <input
                        type="text"
                        id="card-number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="card-cvv"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        CVV
                      </label>
                      <input
                        type="text"
                        id="card-cvv"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label
                        htmlFor="card-expiry"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        id="card-expiry"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="card-name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Name on Card
                      </label>
                      <input
                        type="text"
                        id="card-name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "upi" && (
                <div id="upi-fields" className="mb-6">
                  <label
                    htmlFor="upi-id"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    UPI ID
                  </label>
                  <input
                    type="text"
                    id="upi-id"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="yourname@upi"
                  />
                </div>
              )}

              {paymentMethod === "net-banking" && (
                <div id="net-banking-fields" className="mb-6">
                  <label
                    htmlFor="bank-select"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select Bank
                  </label>
                  <select
                    id="bank-select"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select your bank</option>
                    <option value="sbi">State Bank of India</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                    <option value="other">Other Bank</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Donate Now
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
      <div className="text-3xl font-extrabold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function HeroSlideshow() {
  const { data } = useQuery<GetGalleryResponse>({
    queryKey: ["gallery-hero"],
    queryFn: async () => apiGet("/api/gallery/featured", { images: [] }),
  });
  const imgs = data?.images || [];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (imgs.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % imgs.length), 6000);
    return () => clearInterval(id);
  }, [imgs.length]);
  const current =
    imgs[idx]?.url ||
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=60";
  return (
    <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg relative">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={current}
          alt="Gallery"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
      </AnimatePresence>
    </div>
  );
}
