import express from 'express';
import { runPipelineForLead, runBatchPipeline } from '../workers/pipelineOrchestrator.js';

const router = express.Router();

// Match /pipeline/run when mounted on /api router prefix
router.post('/pipeline/run', async (req, res) => {
  try {
    const { leadId, batch_size, force_sync } = req.body;

    if (leadId) {
      const result = await runPipelineForLead(leadId);
      return res.status(200).json({ success: true, mode: 'single', result });
    }

    const batchResult = await runBatchPipeline({ batchSize: batch_size || 100, forceSync: force_sync || false });
    return res.status(200).json({ success: true, mode: 'batch', result: batchResult });
  } catch (err) {
    console.error('[Pipeline Route Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
