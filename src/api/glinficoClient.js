/**
 * GLINFICO FOD API Client
 * Handles requests to Express backend endpoints for REI submissions,
 * CoStar/CBRE valuation lookups, and ServiceLink eClosing dispatches.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const glinficoClient = {
  /**
   * Submits a deal payload to the Node/Express backend server
   * Endpoint: POST /api/deals/submit
   */
  async submitDeal(dealData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/deals/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('glinficoClient.submitDeal error:', error);
      throw error;
    }
  },

  /**
   * Fetches automated property valuation metrics from CoStar/CBRE proxy
   * Endpoint: POST /api/property/valuation
   */
  async getPropertyValuation(address) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/property/valuation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('glinficoClient.getPropertyValuation error:', error);
      throw error;
    }
  },

  /**
   * Dispatches title and eClosing order to ServiceLink
   * Endpoint: POST /api/servicelink/order
   */
  async dispatchServiceLinkOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/servicelink/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('glinficoClient.dispatchServiceLinkOrder error:', error);
      throw error;
    }
  }
};

export default glinficoClient;
