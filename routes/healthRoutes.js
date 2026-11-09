const express = require('express');
const router = express.Router();
const os = require('os');
const { getDbStatus } = require('../config/db');
const { getRedisStatus } = require('../config/redis');
const { getQueueStatus } = require('../services/queueService');

router.get('/', (req, res) => {
  const memory = process.memoryUsage();

  res.status(200).json({
    status: 'HEALTHY',
    service: 'Cloud-Native Task & Team Collaboration API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    cloudEnvironment: {
      provider: process.env.RENDER ? 'Render PaaS' : (process.env.VERCEL ? 'Vercel Serverless' : (process.env.DOCKER ? 'Docker Container' : 'Localhost / Self-Hosted')),
      nodeVersion: process.version,
      platform: `${os.platform()} (${os.arch()})`,
      cpuCores: os.cpus().length,
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024)
    },
    processMetrics: {
      rssMB: Math.round(memory.rss / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024)
    },
    integrations: {
      database: getDbStatus(),
      caching: getRedisStatus(),
      backgroundQueue: getQueueStatus(),
      storage: 'Local File Storage / Public Assets'
    }
  });
});

module.exports = router;
