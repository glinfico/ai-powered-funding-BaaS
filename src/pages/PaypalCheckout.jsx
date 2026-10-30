import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaypalCheckout() {
  const [searchParams] = useSearchParams();
  const planName = searchParams.get("plan") || "Professional";
  const amount = searchParams.get("amount") || "149.00";
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleProcessPayment = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Secure PayPal Checkout
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Selected Plan: <span className="font-semibold text-blue-600">{planName} (${amount}/mo)</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          
          {/* Payment Method Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Accepted via PayPal:</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`py-2 px-3 text-xs font-semibold rounded-md border ${paymentMethod === "paypal" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                PayPal / Credit
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-2 px-3 text-xs font-semibold rounded-md border ${paymentMethod === "card" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                Credit / Debit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("ach")}
                className={`py-2 px-3 text-xs font-semibold rounded-md border ${paymentMethod === "ach" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                ACH Bank Transfer
              </button>
            </div>
          </div>

          {success ? (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">
              <h3 className="font-bold text-lg">Payment Verified!</h3>
              <p className="text-sm mt-1">Your PayPal transaction for {planName} plan has been completed.</p>
              <a href="/portal" className="mt-4 inline-block px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700">Go to Portal Hub</a>
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
                <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm text-center">
                  You will be directed to PayPal to authorize your subscription of <strong>${amount}/month</strong>.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition flex justify-center items-center"
              >
                {loading ? "Connecting to PayPal..." : `Pay $${amount} via PayPal`}
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
