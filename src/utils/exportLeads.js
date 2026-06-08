const HEADERS = [
  "First Name", "Last Name", "Email", "Phone", "Company",
  "Loan Type", "Loan Amount", "Credit Score Range", "Annual Revenue",
  "Years in Business", "Status", "Source", "Priority", "Assigned To",
  "Last Contact", "Next Follow Up", "Notes", "Created Date"
];

const STATUS_LABELS = {
  new: "New", contacted: "Contacted", qualified: "Qualified",
  proposal_sent: "Proposal Sent", negotiation: "Negotiation",
  approved: "Approved", funded: "Funded", lost: "Lost",
};

const LOAN_TYPE_LABELS = {
  business_loan: "Business Loan", equipment_financing: "Equipment Financing",
  commercial_real_estate: "Commercial Real Estate", sba_loan: "SBA Loan",
  line_of_credit: "Line of Credit", invoice_factoring: "Invoice Factoring",
  merchant_cash_advance: "Merchant Cash Advance", other: "Other",
};

function escape(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportLeadsToCSV(leads, filename = "leads_export.csv") {
  const rows = [
    HEADERS.join(","),
    ...leads.map(l => [
      l.first_name, l.last_name, l.email, l.phone, l.company,
      LOAN_TYPE_LABELS[l.loan_type] || l.loan_type,
      l.loan_amount, l.credit_score_range, l.annual_revenue,
      l.years_in_business,
      STATUS_LABELS[l.status] || l.status,
      l.source, l.priority, l.assigned_to,
      l.last_contact_date, l.next_follow_up,
      l.notes,
      l.created_date ? new Date(l.created_date).toLocaleDateString() : "",
    ].map(escape).join(","))
  ];

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}