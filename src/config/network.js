/**
 * Network scale figures — single source of truth.
 *
 * These numbers were hardcoded in at least eight places and had drifted badly:
 * the homepage said 22,450 while Platform, Submit and the CRM Lenders page
 * still said "500+", copy that predated the lender engine scale-up. Investors
 * spotted two of them; a third was sitting on the Submit page.
 *
 * Verified against the live Supabase tables on 6 Nov 2026:
 *     lenders    22,454
 *     investors   3,000
 *
 * The displayed values use "+" and round down. A table that grows makes an
 * exact figure wrong the moment a row is added, and an overstatement in
 * investor-facing copy is worse than a conservative one.
 *
 * When these change, change them here — nowhere else.
 */

export const NETWORK = {
  // Capital partners indexed in the lenders table.
  lenders: {
    exact: 22454,
    display: '22,450+',
    short: '22K+',
  },
  // Accredited LP partners.
  investors: {
    exact: 3000,
    display: '3,000',
    short: '3K',
  },
  // Leads under management.
  leads: {
    exact: 8000,
    display: '8,000+',
    short: '8K+',
  },
};

/** "22,450+ lenders" */
export const LENDERS = NETWORK.lenders.display;
export const INVESTORS = NETWORK.investors.display;
export const LEADS = NETWORK.leads.display;
