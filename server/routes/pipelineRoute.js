import express from 'express';
import { executeIDEPipeline } from '../workers/pipelineOrchestrator.js';

const router = express.Router();

router.post('/api/pipeline/run', async (req, res) => {
  const { leadId } = req.body;
  if (!leadId) {
    return res.status(400).json({ success: false, error: 'leadId is required.' });
  }

  try {
    const result = await executeIDEPipeline(leadId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Pipeline execution error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
