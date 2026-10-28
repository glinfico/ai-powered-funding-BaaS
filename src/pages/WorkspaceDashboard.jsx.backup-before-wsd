import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function getData(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) {
    throw new Error(`${path}: HTTP ${response.status}`);
  }
  return response.json();
}

function rows(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function amount(item, ...keys) {
  for (const key of keys) {
    const value = Number(item?.[key]);
    if (Number.isFinite(value) && item?.[key] != null) return value;
  }
  return 0;
}

function Panel({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

export default function WorkspaceDashboard() {
  const [data, setData] = useState({
    applications: [],
    leads: [],
    commissions: [],
  });
  const [health, setHealth] = useState("Checking");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);

    const checks = [
      ["Health", "/api/health", null],
      ["Applications", "/api/mca/applications", "applications"],
      ["Leads", "/api/leads?limit=2000", "leads"],
      ["Commissions", "/api/commissions", "commissions"],
    ];

    const results = await Promise.all(
      checks.map(async ([name, path, key]) => {
        try {
          const result = await getData(path);
          return { name, key, result, error: null };
        } catch (error) {
          return { name, key, result: null, error: `${name}: ${error.message}` };
        }
      })
    );

    const next = { applications: [], leads: [], commissions: [] };
    const failures = [];

    for (const item of results) {
      if (item.error) {
        failures.push(item.error);
        continue;
      }

      if (item.name === "Health") {
        setHealth(
          item.result?.status === "ok" ||
          item.result?.status === "healthy"
            ? "Connected"
            : "Responding"
        );
      } else {
        next[item.key] = rows(item.result, item.key);
      }
    }

    if (failures.some((error) => error.startsWith("Health:"))) {
      setHealth("Unavailable");
    }

    setData(next);
    setErrors(failures);
    setUpdated(new Date().toLocaleString());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const applications = data.applications;
  const leads = data.leads;
  const commissions = data.commissions;

  const funded = applications.filter((item) =>
    String(item.status || "").toLowerCase() === "funded"
  );

  const active = applications.filter((item) =>
    !["funded", "lost", "declined", "cancelled", "canceled"]
      .includes(String(item.status || "").toLowerCase())
  );

  const pipelineValue = active.reduce(
    (sum, item) => sum + amount(item, "requested_amount", "loan_amount", "amount"),
    0
  );

  const fundedValue = funded.reduce(
    (sum, item) => sum + amount(item, "funded_amount", "approved_amount", "requested_amount"),
    0
  );

  const commissionValue = commissions.reduce(
    (sum, item) => sum + amount(item, "broker_share", "commission_amount", "amount"),
    0
  );

  const stats = [
    { label: "Leads", value: loading ? "…" : leads.length, color: "border-amber-400" },
    { label: "Applications", value: loading ? "…" : applications.length, color: "border-blue-400" },
    { label: "Active Applications", value: loading ? "…" : active.length, color: "border-sky-400" },
    { label: "Pipeline Value", value: loading ? "…" : money(pipelineValue), color: "border-violet-400" },
    { label: "Funded Volume", value: loading ? "…" : money(fundedValue), color: "border-emerald-400" },
    { label: "Commissions", value: loading ? "…" : money(commissionValue), color: "border-rose-400" },
  ];

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
            GLINFICO.FOD
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Command Center
          </h1>
          <p className="mt-1 text-slate-500">
            Live operational overview from your existing backend
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${
            health === "Connected"
              ? "bg-emerald-100 text-emerald-800"
              : health === "Unavailable"
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
          }`}>
            API: {health}
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>

      {errors.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">
            Some backend endpoints need attention
          </h2>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-900">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
          <p className="mt-2 text-sm text-amber-800">
            Working endpoints can still display data. An unavailable endpoint
            does not mean its underlying database is empty.
          </p>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-slate-200 border-l-4 ${stat.color} bg-white p-5 shadow-sm`}
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Recent Applications">
          {applications.length === 0 ? (
            <p className="text-sm text-slate-500">
              {loading ? "Loading applications…" : "No application records returned by this endpoint."}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.slice(0, 8).map((app, index) => (
                <div key={app.id || index} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {app.merchant_info?.legalName ||
                        app.company_name ||
                        app.business_name ||
                        app.id ||
                        "Application"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {app.created_at
                        ? new Date(app.created_at).toLocaleDateString()
                        : "Date not supplied"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">
                      {money(amount(app, "requested_amount", "loan_amount", "amount"))}
                    </p>
                    <span className="text-xs capitalize text-slate-500">
                      {app.status || app.mca_tier || "Submitted"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent Leads">
          {leads.length === 0 ? (
            <p className="text-sm text-slate-500">
              {loading ? "Loading leads…" : "No lead records returned by this endpoint."}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.slice(0, 8).map((lead, index) => (
                <div key={lead.id || index} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {[lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
                        lead.company ||
                        lead.company_name ||
                        lead.business_name ||
                        lead.name ||
                        lead.email ||
                        lead.id ||
                        "Lead"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {lead.company || lead.company_name || lead.email || "Lead record"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                    {lead.status || "New"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/crm/leads"
            className="mt-4 inline-block text-sm font-semibold text-amber-700 hover:underline"
          >
            Open Leads →
          </Link>
        </Panel>
      </section>

      <Panel title="Backend Connection Check">
        <div className="space-y-3">
          {[
            ["Health", "/api/health"],
            ["MCA Applications", "/api/mca/applications"],
            ["Leads", "/api/leads?limit=2000"],
            ["Commissions", "/api/commissions"],
          ].map(([name, path]) => {
            const failed = errors.some((error) => error.startsWith(`${name}:`));
            return (
              <div key={path} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-700">{name}</span>
                <code className="text-xs text-slate-500">{path}</code>
                <span className={failed ? "font-medium text-red-600" : "font-medium text-emerald-700"}>
                  {failed ? "Needs attention" : loading ? "Checking" : "Responded"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Last checked: {updated || "Not checked yet"}
        </p>
      </Panel>
    </main>
  );
}
