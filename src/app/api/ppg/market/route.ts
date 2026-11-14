import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { verifySession, GATE_COOKIE } from "@/lib/gate";
import { ensureMarketSchema, partyFor, expireOffers, logTrade, FEE_RATE, ASSET_CLASSES, GRADES } from "@/lib/market";

export const dynamic = "force-dynamic";
const rows = async (q: any): Promise<any[]> => db.execute(q).then((r: any) => r.rows || r);
const money = (v: unknown) => Math.round(Number(String(v ?? "").replace(/[^0-9.]/g, "")) || 0);

async function who(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok || !["lender", "investor", "admin"].includes(s.role)) return null;
  await ensureMarketSchema();
  const party = await partyFor(s.role, s.email);
  return { s, party };
}

// GET → market board (active packages, my listings with offers, my offers)
export async function GET(req: NextRequest) {
  const w = await who(req);
  if (!w) return NextResponse.json({ error: "Investor or lender sign-in required" }, { status: 401 });
  await expireOffers();
  const me = w.party;
  const active = await rows(sql`SELECT id, ref, asset_class, title, principal, asking_price, yield_pct, term_months, risk_grade, description, status, seller_type, seller_id
    FROM market_packages WHERE status IN ('Active','Under Offer') ORDER BY id DESC LIMIT 200`);
  const mine = me ? await rows(sql`SELECT p.*, COALESCE(json_agg(json_build_object('id', o.id, 'price', o.price, 'fee', o.fee, 'status', o.status, 'due_at', o.due_at))
      FILTER (WHERE o.id IS NOT NULL), '[]') AS offers
    FROM market_packages p LEFT JOIN market_offers o ON o.package_id = p.id
    WHERE p.seller_type=${me.type} AND p.seller_id=${me.id} GROUP BY p.id ORDER BY p.id DESC LIMIT 100`) : [];
  const myOffers = me ? await rows(sql`SELECT o.id, o.price, o.fee, o.status, o.due_at, p.ref, p.title, p.asking_price
    FROM market_offers o JOIN market_packages p ON p.id = o.package_id WHERE o.buyer_type=${me.type} AND o.buyer_id=${me.id} ORDER BY o.id DESC LIMIT 100`) : [];
  return NextResponse.json({
    me, feeRate: FEE_RATE, assetClasses: ASSET_CLASSES, grades: GRADES,
    packages: active.map((p) => ({ ...p, own: !!me && p.seller_type === me.type && Number(p.seller_id) === me.id })),
    myListings: mine, myOffers,
  });
}

// POST { action: "list" | "offer" | "respond" | "withdraw", ... }
export async function POST(req: NextRequest) {
  const w = await who(req);
  if (!w) return NextResponse.json({ ok: false, error: "Investor or lender sign-in required" }, { status: 401 });
  if (!w.party) return NextResponse.json({ ok: false, error: "No lender or investor profile is linked to your email" }, { status: 403 });
  await expireOffers();
  const me = w.party;
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  if (action === "list") {
    const asset = String(b.asset_class || ""), title = String(b.title || "").trim().slice(0, 160);
    const principal = money(b.principal), asking = money(b.asking_price);
    const yieldPct = Math.min(Math.max(Number(b.yield_pct) || 0, 0), 999), term = Math.min(Math.max(parseInt(b.term_months) || 0, 1), 600);
    const grade = String(b.risk_grade || "B");
    if (!(ASSET_CLASSES as readonly string[]).includes(asset) || !(GRADES as readonly string[]).includes(grade)) return NextResponse.json({ ok: false, error: "Choose an asset class and risk grade" }, { status: 400 });
    if (!title || principal <= 0 || asking <= 0) return NextResponse.json({ ok: false, error: "Title, principal and asking price are required" }, { status: 400 });
    const [p] = await rows(sql`INSERT INTO market_packages (seller_type, seller_id, seller_email, asset_class, title, principal, asking_price, yield_pct, term_months, risk_grade, description)
      VALUES (${me.type}, ${me.id}, ${w.s.email}, ${asset}, ${title}, ${principal}, ${asking}, ${yieldPct}, ${term}, ${grade}, ${String(b.description || "").slice(0, 1000)}) RETURNING id`);
    const tag = asset.replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase() || "PKG";
    const ref = `PKG-${String(p.id).padStart(5, "0")}-${tag}`;
    await db.execute(sql`UPDATE market_packages SET ref=${ref} WHERE id=${p.id}`);
    await logTrade("MARKET.package_listed", { ref, seller: me, principal, asking });
    return NextResponse.json({ ok: true, ref });
  }

  if (action === "offer") {
    const id = Number(b.package_id) || 0;
    const [p] = await rows(sql`SELECT * FROM market_packages WHERE id=${id}`);
    if (!p || !["Active", "Under Offer"].includes(p.status)) return NextResponse.json({ ok: false, error: "This package is not available" }, { status: 409 });
    if (p.seller_type === me.type && Number(p.seller_id) === me.id) return NextResponse.json({ ok: false, error: "You can't buy your own package" }, { status: 400 });
    const price = money(b.price) || Number(p.asking_price);
    if (price <= 0) return NextResponse.json({ ok: false, error: "Enter a valid price" }, { status: 400 });
    const dup = await rows(sql`SELECT 1 FROM market_offers WHERE package_id=${id} AND buyer_type=${me.type} AND buyer_id=${me.id} AND status='Pending'`);
    if (dup.length) return NextResponse.json({ ok: false, error: "You already have a pending offer on this package" }, { status: 409 });
    const fee = Math.round(price * FEE_RATE);
    const [o] = await rows(sql`INSERT INTO market_offers (package_id, buyer_type, buyer_id, buyer_email, price, fee, due_at)
      VALUES (${id}, ${me.type}, ${me.id}, ${w.s.email}, ${price}, ${fee}, NOW() + INTERVAL '24 hours') RETURNING id`);
    await db.execute(sql`UPDATE market_packages SET status='Under Offer' WHERE id=${id} AND status='Active'`);
    await logTrade("MARKET.offer_made", { ref: p.ref, offerId: o.id, buyer: me, price, fee });
    return NextResponse.json({ ok: true, offerId: o.id, price, fee });
  }

  if (action === "respond") {
    const oid = Number(b.offer_id) || 0, accept = b.decision === "accept";
    const [o] = await rows(sql`SELECT o.*, p.seller_type, p.seller_id, p.ref, p.status AS pstatus FROM market_offers o JOIN market_packages p ON p.id=o.package_id WHERE o.id=${oid}`);
    if (!o) return NextResponse.json({ ok: false, error: "Offer not found" }, { status: 404 });
    if (o.seller_type !== me.type || Number(o.seller_id) !== me.id) return NextResponse.json({ ok: false, error: "Only the seller can answer this offer" }, { status: 403 });
    if (o.status !== "Pending") return NextResponse.json({ ok: false, error: `This offer is already ${o.status}` }, { status: 409 });
    if (accept) {
      await db.execute(sql`UPDATE market_offers SET status='Accepted', responded_at=NOW() WHERE id=${oid}`);
      await db.execute(sql`UPDATE market_offers SET status='Declined', responded_at=NOW() WHERE package_id=${o.package_id} AND id<>${oid} AND status='Pending'`);
      await db.execute(sql`UPDATE market_packages SET status='Sold' WHERE id=${o.package_id}`);
      await logTrade("MARKET.trade_settled", { ref: o.ref, offerId: oid, price: Number(o.price), fee: Number(o.fee), seller: me, buyer: { type: o.buyer_type, id: o.buyer_id } });
    } else {
      await db.execute(sql`UPDATE market_offers SET status='Declined', responded_at=NOW() WHERE id=${oid}`);
      await db.execute(sql`UPDATE market_packages SET status='Active' WHERE id=${o.package_id} AND status='Under Offer'
        AND NOT EXISTS (SELECT 1 FROM market_offers WHERE package_id=${o.package_id} AND status='Pending')`);
    }
    return NextResponse.json({ ok: true, status: accept ? "Accepted" : "Declined" });
  }

  if (action === "withdraw") {
    const id = Number(b.package_id) || 0;
    const r = await rows(sql`UPDATE market_packages SET status='Withdrawn' WHERE id=${id} AND seller_type=${me.type} AND seller_id=${me.id} AND status IN ('Active','Under Offer') RETURNING ref`);
    if (!r.length) return NextResponse.json({ ok: false, error: "Package not found or already closed" }, { status: 404 });
    await db.execute(sql`UPDATE market_offers SET status='Declined', responded_at=NOW() WHERE package_id=${id} AND status='Pending'`);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
