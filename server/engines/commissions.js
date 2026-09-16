async function calculateCommission(deal, supabaseClient) {

  const rates = {
    MCA: 0.05,
    CRE: 0.03,
    MA: 0.05,
    ALS: 0.02
  };

  const rate = rates[deal.product_type];
  const commissionAmount = deal.funded_amount * rate;

  // Write to commissions table
  await supabaseClient.from('commissions').insert({
    deal_id: deal.id,
    broker_id: deal.broker_id,
    product_type: deal.product_type,
    deal_amount: deal.funded_amount,
    rate: rate,
    commission_amount: commissionAmount,
    status: 'pending_payout',
    created_at: new Date()
  });

  // Trigger PayPal payout (your AR)
  await triggerPayPalPayout(deal.broker_id, commissionAmount);

  return commissionAmount;
}
