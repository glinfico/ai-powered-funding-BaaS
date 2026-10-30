import React, { useState } from "react";

export default function BrokerSettings() {
  const [brokerProfile, setBrokerProfile] = useState({
    name: "Jane Doe",
    email: "broker@fundbaas.com",
    commissionRate: "15%",
    payoutEmail: "payouts@fundbaas.com",
    status: "Active"
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Broker Account & Commission Settings</h2>
        
        {saved && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            Broker settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Broker Name</label>
              <input
                type="text"
                value={brokerProfile.name}
                onChange={(e) => setBrokerProfile({...brokerProfile, name: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sign-in Email</label>
              <input
                type="email"
                value={brokerProfile.email}
                onChange={(e) => setBrokerProfile({...brokerProfile, email: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Commission Rate (%)</label>
              <input
                type="text"
                value={brokerProfile.commissionRate}
                onChange={(e) => setBrokerProfile({...brokerProfile, commissionRate: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">PayPal / Payout Email</label>
              <input
                type="email"
                value={brokerProfile.payoutEmail}
                onChange={(e) => setBrokerProfile({...brokerProfile, payoutEmail: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
            >
              Save Broker Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
