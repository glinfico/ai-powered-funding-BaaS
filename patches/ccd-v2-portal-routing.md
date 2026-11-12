# CCD-V2: route sign-in (/gate) to per-entity PPG portals
Apply in ~/ccd-v2-site (branch ccd-v2), then `npx netlify-cli deploy --prod --site <admin-glinfico-id>`.

## 0) DB (paste supabase/staff-portal.sql in Supabase SQL editor of kpoqglkyvfaztaemhtsa)
Adds staff.portal (borrower|broker|lender|investor, default borrower).

## 1) src/db/schema.ts — staff table, add after the `role` line:
  portal: text("portal").notNull().default("borrower"), // borrower|broker|lender|investor

## 2) src/app/api/gate/route.ts
(a) add_user: store portal from the request:
  role: String(b.role) === "admin" ? "admin" : "user",
  portal: ["borrower","broker","lender","investor"].includes(String(b.portal||"")) ? String(b.portal) : "borrower"
(b) sign-in: after `u` is resolved (local staff or Supabase), compute portal and redirect:
  const portal = (u as any).portal && ["borrower","broker","lender","investor"].includes((u as any).portal)
    ? (u as any).portal
    : (u.role === "admin" ? "borrower" : "borrower"); // default; override per-user via staff.portal
  // detect by email in leads if no staff row:
  // const [leadRow] = await db.select({id: leads.id}).from(leads).where(eq(leads.email, u.email)).limit(1);
  // if (leadRow && !portal) portal = "borrower";
  admin redirect stays "/crm"; user redirect becomes:
  const res = NextResponse.json({ ok: true, role: "user", portal, redirect: `/ppg?portal=${portal}` });
  (also add portal to the add_user response user object)

## 3) src/app/gate/page.tsx — add a portal picker above the sign-in button:
  const [portal, setPortal] = useState("borrower");
  ... in the form body include portal in the POST body: JSON.stringify({ email, password, portal })
  ... UI chips:
  {["borrower","broker","lender","investor"].map(p => (
    <button type="button" key={p} onClick={() => setPortal(p)}
      className={"px-2.5 py-1.5 rounded-lg text-[11px] font-bold border " + (portal===p ? "bg-emerald-500 text-stone-950 border-emerald-500" : "bg-white/5 text-stone-300 border-white/10")}>
      {p[0].toUpperCase()+p.slice(1)} PPG
    </button>
  ))}

## 4) src/app/api/ppg/route.ts — include the user's portal in the response:
  import { staff } from "@/db/schema";  // add
  const [st] = await db.select().from(staff).where(eq(staff.email, s.email)).limit(1);
  ... response: { email: s.email, role: s.role, portal: st?.portal || "borrower", leads: … }

## 5) src/app/ppg/page.tsx — show the portal in the header:
  const sp = useSearchParams(); const portal = sp.get("portal") || me?.portal || "borrower";
  header sub-line: `{me.email} · role: {me.role} · portal: {portal} · routed here by the sign-in, no subdomain`

## Test
1. POST /api/gate {action:"add_user", staffPassword, email:"broker@x.com", password:"...", role:"user", portal:"broker"}
2. Sign in at /gate as broker@x.com → expect redirect /ppg?portal=broker, header shows "Broker".
3. admin still → /crm. Sign in via Supabase (PFE login) → /ppg?portal=borrower (or detected).
