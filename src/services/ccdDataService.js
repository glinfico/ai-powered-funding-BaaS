export async function fetchCCDRealtimeData() {
  try {
    const response = await fetch('/api/ccd/metrics');
    const result = await response.json();

    if (!result.success) {
      throw new Error('Failed to fetch secure CCD metrics from backend');
    }

    return {
      metrics: result.metrics,
      leads: [],
      lenders: [],
      investors: [],
      attributions: []
    };
  } catch (err) {
    console.error('CRITICAL CCD Telemetry Sync Failure:', err);
    throw err;
  }
}
