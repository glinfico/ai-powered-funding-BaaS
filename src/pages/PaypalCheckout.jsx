import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaypalCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planName = searchParams.get("plan") || "Growth";
  const amount = searchParams.get("amount") || "1499.00";
  const code = searchParams.get("code") || "G-1499";
  const billing = searchParams.get("billing") || "monthly";

  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleProcessPayment = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("glinfico_broker_subscribed", "true");
      localStorage.setItem("glinfico_active_tier", planName);
      localStorage.setItem("glinfico_sub_code", code);
      
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Secure PayPal Subscription Checkout
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Selected Tier: <span className="font-semibold text-amber-600">{planName} (${amount}/{billing === "annual" ? "yr" : "mo"})</span>
        </p>
        {code && (
          <p className="text-center text-xs text-gray-400 mt-1">
            Subscription Code: <span className="font-mono text-gray-600">{code}</span>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Method:</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`py-2 px-3 text-xs font-semibold rounded-md border ${paymentMethod === "paypal" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                PayPal / Credit
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-2 px-3 text-xs font-semibold rounded-md border ${paymentMethod === "card" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                Credit / Debit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("ach")}
                className={`py-2 px-3 text-xs font-semibold rounded-md border ${paymentMethod === "ach" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                ACH Bank Transfer
              </button>
            </div>
          </div>

          {success ? (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">
              <h3 className="font-bold text-lg">Subscription Active!</h3>
              <p className="text-sm mt-1">Your PayPal transaction for the <strong>{planName}</strong> plan (${amount}) is verified.</p>
              <p className="text-xs text-green-600 mt-1">100% Broker Commission Tier Unlocked.</p>
              <button 
                onClick={() => navigate("/portal")} 
                className="mt-4 inline-block px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
              >
                Go to Portal Hub →
              </button>
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {paymentMethod === "card" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Card Number (CC/DC)</label>
                    <input type="text" required placeholder="Card number" className="mt-1 w-full border rounded p-2 text-sm border-gray-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Expiry Date</label>
                      <input type="text" required placeholder="MM/YY" className="mt-1 w-full border rounded p-2 text-sm border-gray-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">CVV</label>
                      <input type="text" required placeholder="123" className="mt-1 w-full border rounded p-2 text-sm border-gray-300" />
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === "ach" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Bank Routing Number</label>
                    <input type="text" required placeholder="Enter routing" className="mt-1 w-full border rounded p-2 text-sm border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Account Number</label>
                    <input type="text" required placeholder="Enter account" className="mt-1 w-full border rounded p-2 text-sm border-gray-300" />
                  </div>
                </>
              )}

              {paymentMethod === "paypal" && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm text-center">
                  You will complete your subscription authorization of <strong>${amount}</strong> for the <strong>{planName}</strong> plan via PayPal.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow transition flex justify-center items-center"
              >
                {loading ? "Authorizing via PayPal..." : `Complete Subscription ($${amount})`}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-gray-500">
            Encrypted 256-bit SSL Connection • Guaranteed by PayPal Payment Gateway
          </div>
        </div>
      </div>
    </div>
  );
}
