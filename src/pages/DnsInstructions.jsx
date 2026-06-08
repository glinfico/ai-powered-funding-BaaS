import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCheck, Globe, Server, Shield, AlertTriangle, Info } from "lucide-react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-2 text-slate-400 hover:text-slate-700 transition-colors">
      {copied ? <CheckCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function DnsRow({ type, name, value, ttl, note }) {
  return (
    <div className="grid grid-cols-12 gap-2 py-3 border-b border-slate-100 last:border-0 text-sm items-start">
      <div className="col-span-1">
        <Badge variant="outline" className="font-mono text-xs font-bold">{type}</Badge>
      </div>
      <div className="col-span-2 font-mono text-slate-700 break-all">{name}</div>
      <div className="col-span-6 font-mono text-slate-900 text-xs break-all flex items-start gap-1">
        <span>{value}</span>
        <CopyButton text={value} />
      </div>
      <div className="col-span-1 text-slate-400 text-xs">{ttl}</div>
      <div className="col-span-2 text-slate-400 text-xs italic">{note}</div>
    </div>
  );
}

function StepCard({ number, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm">{number}</div>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

const FOD_DNS = [
  { type: "A", name: "fod", value: "76.76.21.21", ttl: "3600", note: "Main IPv4" },
  { type: "AAAA", name: "fod", value: "2606:4700:3035::ac43:c42d", ttl: "3600", note: "IPv6 (optional)" },
  { type: "CNAME", name: "www.fod", value: "cname.vercel-dns.com.", ttl: "3600", note: "www redirect" },
];

const BCD_DNS = [
  { type: "A", name: "bcd", value: "76.76.21.21", ttl: "3600", note: "Main IPv4" },
  { type: "AAAA", name: "bcd", value: "2606:4700:3035::ac43:c42d", ttl: "3600", note: "IPv6 (optional)" },
  { type: "CNAME", name: "www.bcd", value: "cname.vercel-dns.com.", ttl: "3600", note: "www redirect" },
];

const EMAIL_DNS = [
  { type: "MX", name: "@", value: "aspmx.l.google.com.", ttl: "3600", note: "Priority 1" },
  { type: "MX", name: "@", value: "alt1.aspmx.l.google.com.", ttl: "3600", note: "Priority 5" },
  { type: "MX", name: "@", value: "alt2.aspmx.l.google.com.", ttl: "3600", note: "Priority 10" },
  { type: "TXT", name: "@", value: "v=spf1 include:_spf.google.com ~all", ttl: "3600", note: "SPF" },
  { type: "CNAME", name: "mail", value: "ghs.google.com.", ttl: "3600", note: "Mail CNAME" },
];

export default function DnsInstructions() {
  const [tab, setTab] = useState("fod");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Globe className="h-8 w-8 text-amber-500" />
            DNS & Hosting Setup
          </h1>
          <p className="text-slate-500 mt-1">
            Step-by-step DNS configuration for <strong>fod.glinfico.com</strong> and <strong>bcd.glinfico.com</strong>
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 px-3 py-1.5">glinfico.com registrar required</Badge>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Before you start</p>
          <p>Log into your domain registrar (where you own <strong>glinfico.com</strong> — typically GoDaddy, Namecheap, Cloudflare, or Google Domains). Navigate to <strong>DNS Management / DNS Records</strong> for the glinfico.com zone. All records below are <em>subdomains</em> — you are NOT replacing the root domain.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="fod">fod.glinfico.com</TabsTrigger>
          <TabsTrigger value="bcd">bcd.glinfico.com</TabsTrigger>
          <TabsTrigger value="email">Email / SPF</TabsTrigger>
        </TabsList>

        {/* ── FOD ─────────────────────────────────────────────────────── */}
        <TabsContent value="fod" className="space-y-5 mt-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="h-5 w-5 text-amber-500" />
                fod.glinfico.com — DNS Records
              </CardTitle>
              <p className="text-sm text-slate-500">GLINFICO Financial Operations Division portal</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-2 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200 mb-1">
                <div className="col-span-1">Type</div>
                <div className="col-span-2">Name</div>
                <div className="col-span-6">Value / Target</div>
                <div className="col-span-1">TTL</div>
                <div className="col-span-2">Note</div>
              </div>
              {FOD_DNS.map((r, i) => <DnsRow key={i} {...r} />)}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step-by-Step — fod.glinfico.com</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <StepCard number="1" title="Add the A Record for fod">
                <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs space-y-1">
                  <p><span className="text-slate-400">Type:</span> A</p>
                  <p><span className="text-slate-400">Host/Name:</span> fod</p>
                  <p className="flex items-center"><span className="text-slate-400 mr-1">Value:</span> 76.76.21.21 <CopyButton text="76.76.21.21" /></p>
                  <p><span className="text-slate-400">TTL:</span> 3600 (or "Automatic")</p>
                </div>
                <p className="text-xs text-slate-500 mt-2">This points <strong>fod.glinfico.com</strong> to your hosting provider's IP (Vercel). If using Cloudflare proxy, use their A record IP from your project dashboard instead.</p>
              </StepCard>

              <StepCard number="2" title="Add CNAME for www.fod (optional but recommended)">
                <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs space-y-1">
                  <p><span className="text-slate-400">Type:</span> CNAME</p>
                  <p><span className="text-slate-400">Host/Name:</span> www.fod</p>
                  <p className="flex items-center"><span className="text-slate-400 mr-1">Value:</span> cname.vercel-dns.com. <CopyButton text="cname.vercel-dns.com." /></p>
                </div>
              </StepCard>

              <StepCard number="3" title="Add domain in your hosting platform">
                <p className="text-sm text-slate-600">Go to your hosting dashboard (Vercel / Base44 / cPanel) → <strong>Domains</strong> → Add custom domain → type <code className="bg-slate-100 px-1 rounded">fod.glinfico.com</code> → Save.</p>
              </StepCard>

              <StepCard number="4" title="Wait for propagation & SSL">
                <p className="text-sm text-slate-600">DNS changes propagate in <strong>5 minutes to 48 hours</strong>. Once live, SSL (HTTPS) is auto-issued by Let's Encrypt. Use <a href="https://dnschecker.org" target="_blank" rel="noreferrer" className="text-amber-600 underline">dnschecker.org</a> to verify propagation globally.</p>
              </StepCard>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-amber-800">
              <p className="font-semibold mb-1">If your registrar is Cloudflare</p>
              <p>Use a <strong>CNAME</strong> record pointing to your Vercel project URL (e.g. <code className="bg-amber-100 px-1 rounded">your-project.vercel.app</code>) instead of the A record. Enable "Proxied" (orange cloud) for DDoS protection. Disable proxy (grey cloud) for debugging only.</p>
            </div>
          </div>
        </TabsContent>

        {/* ── BCD ─────────────────────────────────────────────────────── */}
        <TabsContent value="bcd" className="space-y-5 mt-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="h-5 w-5 text-red-500" />
                bcd.glinfico.com — DNS Records
              </CardTitle>
              <p className="text-sm text-slate-500">FinVenture Pro Executive Intelligence Magazine</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-2 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200 mb-1">
                <div className="col-span-1">Type</div>
                <div className="col-span-2">Name</div>
                <div className="col-span-6">Value / Target</div>
                <div className="col-span-1">TTL</div>
                <div className="col-span-2">Note</div>
              </div>
              {BCD_DNS.map((r, i) => <DnsRow key={i} {...r} />)}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step-by-Step — bcd.glinfico.com</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <StepCard number="1" title="Add the A Record for bcd">
                <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs space-y-1">
                  <p><span className="text-slate-400">Type:</span> A</p>
                  <p><span className="text-slate-400">Host/Name:</span> bcd</p>
                  <p className="flex items-center"><span className="text-slate-400 mr-1">Value:</span> 76.76.21.21 <CopyButton text="76.76.21.21" /></p>
                  <p><span className="text-slate-400">TTL:</span> 3600</p>
                </div>
              </StepCard>

              <StepCard number="2" title="Add CNAME for www.bcd">
                <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs space-y-1">
                  <p><span className="text-slate-400">Type:</span> CNAME</p>
                  <p><span className="text-slate-400">Host/Name:</span> www.bcd</p>
                  <p className="flex items-center"><span className="text-slate-400 mr-1">Value:</span> cname.vercel-dns.com. <CopyButton text="cname.vercel-dns.com." /></p>
                </div>
              </StepCard>

              <StepCard number="3" title="Register bcd.glinfico.com in your hosting platform">
                <p className="text-sm text-slate-600">Go to your CMS/hosting → Domains → Add <code className="bg-slate-100 px-1 rounded">bcd.glinfico.com</code>. This app (Base44) can be published to a custom domain via <strong>Settings → Custom Domain</strong> in the Base44 dashboard.</p>
              </StepCard>

              <StepCard number="4" title="Verify & SSL">
                <p className="text-sm text-slate-600">Check propagation at <a href="https://dnschecker.org/#A/bcd.glinfico.com" target="_blank" rel="noreferrer" className="text-amber-600 underline">dnschecker.org</a>. SSL will be automatically provisioned. Typically live within 1–2 hours.</p>
              </StepCard>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" />
                Base44 Custom Domain (Recommended for bcd)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>Since FinVenture Pro (bcd.glinfico.com) is built on Base44:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Go to <strong>Base44 Dashboard → Your App → Settings → Custom Domains</strong></li>
                <li>Click <strong>Add Domain</strong> → enter <code className="bg-slate-100 px-1 rounded">bcd.glinfico.com</code></li>
                <li>Base44 will show you a <strong>CNAME target</strong> specific to your app (copy it)</li>
                <li>Go to your registrar and add a CNAME record: <code className="bg-slate-100 px-1 rounded">bcd → [Base44 CNAME target]</code></li>
                <li>Click <strong>Verify</strong> in Base44 → SSL auto-issues</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EMAIL ──────────────────────────────────────────────────── */}
        <TabsContent value="email" className="space-y-5 mt-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Email DNS (glinfico.com root zone)</CardTitle>
              <p className="text-sm text-slate-500">For contact@glinfico.com — Google Workspace MX records</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-2 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200 mb-1">
                <div className="col-span-1">Type</div>
                <div className="col-span-2">Name</div>
                <div className="col-span-6">Value</div>
                <div className="col-span-1">TTL</div>
                <div className="col-span-2">Note</div>
              </div>
              {EMAIL_DNS.map((r, i) => <DnsRow key={i} {...r} />)}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">DMARC Record (Recommended)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs space-y-1 mb-3">
                <p><span className="text-slate-400">Type:</span> TXT</p>
                <p><span className="text-slate-400">Name:</span> _dmarc</p>
                <p className="flex items-center">
                  <span className="text-slate-400 mr-1">Value:</span>
                  v=DMARC1; p=quarantine; rua=mailto:contact@glinfico.com
                  <CopyButton text="v=DMARC1; p=quarantine; rua=mailto:contact@glinfico.com" />
                </p>
                <p><span className="text-slate-400">TTL:</span> 3600</p>
              </div>
              <p className="text-xs text-slate-500">DMARC protects your brand from email spoofing. Start with <code className="bg-slate-100 px-1 rounded">p=none</code> to monitor, then upgrade to <code>p=quarantine</code> once verified.</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Verification & Testing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: "DNS Propagation Check", url: "https://dnschecker.org", desc: "Global DNS record verification" },
                  { label: "MX Record Lookup", url: "https://mxtoolbox.com", desc: "Email routing validation" },
                  { label: "SPF/DKIM Test", url: "https://www.mail-tester.com", desc: "Send a test email to check score" },
                  { label: "SSL Certificate", url: "https://www.ssllabs.com/ssltest/", desc: "SSL/TLS health check" },
                ].map((tool) => (
                  <a key={tool.label} href={tool.url} target="_blank" rel="noreferrer"
                    className="flex flex-col p-3 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors group">
                    <span className="font-medium text-slate-800 group-hover:text-amber-700">{tool.label} ↗</span>
                    <span className="text-xs text-slate-400 mt-0.5">{tool.desc}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick reference table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Reference Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 font-semibold text-slate-600">Subdomain</th>
                  <th className="pb-2 font-semibold text-slate-600">Record Type</th>
                  <th className="pb-2 font-semibold text-slate-600">Points To</th>
                  <th className="pb-2 font-semibold text-slate-600">Purpose</th>
                  <th className="pb-2 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { sub: "fod.glinfico.com", type: "A", target: "76.76.21.21", purpose: "FOD portal", status: "Configure" },
                  { sub: "bcd.glinfico.com", type: "A / CNAME", target: "Base44 target", purpose: "FinVenture Pro magazine", status: "Configure" },
                  { sub: "glinfico.com (MX)", type: "MX", target: "Google Workspace", purpose: "Email routing", status: "Verify" },
                  { sub: "glinfico.com (SPF)", type: "TXT", target: "v=spf1 include:...", purpose: "Email security", status: "Add" },
                ].map((row, i) => (
                  <tr key={i} className="py-2">
                    <td className="py-2.5 font-mono text-xs text-slate-700">{row.sub}</td>
                    <td className="py-2.5"><Badge variant="outline" className="font-mono text-xs">{row.type}</Badge></td>
                    <td className="py-2.5 text-xs text-slate-500">{row.target}</td>
                    <td className="py-2.5 text-xs text-slate-600">{row.purpose}</td>
                    <td className="py-2.5">
                      <Badge className={row.status === "Configure" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}