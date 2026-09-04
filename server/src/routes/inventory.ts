import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import {
  inventoryBatchSchema,
  inventoryBatchUpdateSchema,
  dailyLogSchema,
} from '../validators';
import {
  predictInventoryBatchRisk,
  DailyLogEntry,
  InventoryPredictionResult,
} from '../services/inventoryPredictionService';
import { emitNotificationToUser } from '../socket';

const router = Router();

// Helper to compute prediction for a batch with its logs
function evaluateBatchPrediction(batch: any): InventoryPredictionResult {
  const logEntries: DailyLogEntry[] = (batch.dailyLogs || []).map((l: any) => ({
    date: l.date,
    soldQuantity: l.soldQuantity,
    remainingQuantity: l.remainingQuantity,
    restockedQuantity: l.restockedQuantity,
  }));

  return predictInventoryBatchRisk({
    productName: batch.productName,
    currentQuantity: batch.currentQuantity,
    unit: batch.unit,
    expiryDate: batch.expiryDate,
    dailyLogs: logEntries,
  });
}

// 1. Get all inventory batches for logged-in seller with live predictions
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sellerId = req.user!.userId;

    const batches = await prisma.inventoryBatch.findMany({
      where: { sellerId },
      orderBy: { expiryDate: 'asc' },
      include: {
        dailyLogs: {
          orderBy: { date: 'asc' },
          take: 30,
        },
      },
    });

    let atRiskCount = 0;
    let highUrgencyCount = 0;
    let totalStockValueAtRisk = 0;

    const enrichedBatches = batches.map((batch) => {
      const prediction = evaluateBatchPrediction(batch);

      if (prediction.riskLevel === 'HIGH' || prediction.shouldRecommendListing) {
        atRiskCount++;
        const unitCost = batch.costPrice || (batch.mrp ? batch.mrp * 0.7 : 0);
        totalStockValueAtRisk += prediction.recommendedListingQuantity * unitCost;
      }

      if (prediction.daysUntilHighUrgency === 0 && (prediction.daysUntilExpiry ?? 0) > 0) {
        highUrgencyCount++;
      }

      return {
        ...batch,
        prediction,
      };
    });

    res.json({
      batches: enrichedBatches,
      summary: {
        totalBatches: batches.length,
        atRiskCount,
        highUrgencyCount,
        totalStockValueAtRisk: Math.round(totalStockValueAtRisk),
      },
    });
  } catch (err) {
    console.error('List inventory batches error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory batches' });
  }
});

// 2. Get recommendations only
router.get('/recommendations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sellerId = req.user!.userId;

    const batches = await prisma.inventoryBatch.findMany({
      where: { sellerId },
      orderBy: { expiryDate: 'asc' },
      include: {
        dailyLogs: {
          orderBy: { date: 'asc' },
          take: 30,
        },
      },
    });

    const recommendations = batches
      .map((batch) => {
        const prediction = evaluateBatchPrediction(batch);
        return {
          ...batch,
          prediction,
        };
      })
      .filter((b) => b.prediction.shouldRecommendListing && b.prediction.canListOnStockBridge);

    res.json(recommendations);
  } catch (err) {
    console.error('Fetch recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory recommendations' });
  }
});

// 3. Get single batch details with prediction and full history
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const sellerId = req.user!.userId;

    const batch = await prisma.inventoryBatch.findUnique({
      where: { id },
      include: {
        dailyLogs: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!batch || batch.sellerId !== sellerId) {
      res.status(404).json({ error: 'Inventory batch not found' });
      return;
    }

    const prediction = evaluateBatchPrediction(batch);

    res.json({
      ...batch,
      prediction,
    });
  } catch (err) {
    console.error('Get inventory batch error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory batch' });
  }
});

// 4. Create a new inventory batch
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sellerId = req.user!.userId;
    const data = inventoryBatchSchema.parse(req.body);

    const expiryDate = new Date(data.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      res.status(400).json({ error: 'Invalid expiry date format' });
      return;
    }

    const created = await prisma.inventoryBatch.create({
      data: {
        sellerId,
        productName: data.productName.trim(),
        category: data.category,
        batchNumber: data.batchNumber ? data.batchNumber.trim() : null,
        expiryDate,
        currentQuantity: data.currentQuantity,
        unit: data.unit,
        mrp: data.mrp,
        costPrice: data.costPrice,
      },
      include: {
        dailyLogs: true,
      },
    });

    // Automatically create initial log entry for today if currentQuantity > 0
    const todayStr = new Date().toISOString().split('T')[0];
    await prisma.dailyInventoryLog.create({
      data: {
        inventoryBatchId: created.id,
        sellerId,
        date: todayStr,
        soldQuantity: 0,
        remainingQuantity: data.currentQuantity,
        restockedQuantity: data.currentQuantity,
      },
    });

    // Refetch to include initial log in prediction
    const batchWithLog = await prisma.inventoryBatch.findUnique({
      where: { id: created.id },
      include: { dailyLogs: true },
    });

    const prediction = evaluateBatchPrediction(batchWithLog);

    res.status(201).json({
      ...batchWithLog,
      prediction,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Create inventory batch error:', err);
    res.status(500).json({ error: 'Failed to create inventory batch' });
  }
});

// 5. Update an existing inventory batch
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const sellerId = req.user!.userId;
    const data = inventoryBatchUpdateSchema.parse(req.body);

    const existing = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!existing || existing.sellerId !== sellerId) {
      res.status(404).json({ error: 'Inventory batch not found' });
      return;
    }

    const updatePayload: any = { ...data };
    if (data.expiryDate) {
      const exp = new Date(data.expiryDate);
      if (isNaN(exp.getTime())) {
        res.status(400).json({ error: 'Invalid expiry date format' });
        return;
      }
      updatePayload.expiryDate = exp;
    }

    const updated = await prisma.inventoryBatch.update({
      where: { id },
      data: updatePayload,
      include: {
        dailyLogs: { orderBy: { date: 'asc' } },
      },
    });

    const prediction = evaluateBatchPrediction(updated);

    res.json({
      ...updated,
      prediction,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Update inventory batch error:', err);
    res.status(500).json({ error: 'Failed to update inventory batch' });
  }
});

// 6. Delete an inventory batch
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const sellerId = req.user!.userId;

    const existing = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!existing || existing.sellerId !== sellerId) {
      res.status(404).json({ error: 'Inventory batch not found' });
      return;
    }

    await prisma.inventoryBatch.delete({ where: { id } });
    res.json({ message: 'Inventory batch deleted successfully' });
  } catch (err) {
    console.error('Delete inventory batch error:', err);
    res.status(500).json({ error: 'Failed to delete inventory batch' });
  }
});

// 7. Add or update daily inventory log (Daily Store Update)
router.post('/:id/daily-log', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const sellerId = req.user!.userId;
    const data = dailyLogSchema.parse(req.body);

    const batch = await prisma.inventoryBatch.findUnique({
      where: { id },
      include: { dailyLogs: { orderBy: { date: 'asc' } } },
    });

    if (!batch || batch.sellerId !== sellerId) {
      res.status(404).json({ error: 'Inventory batch not found' });
      return;
    }

    // Atomic transaction: Upsert log and update currentQuantity
    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.dailyInventoryLog.upsert({
        where: {
          inventoryBatchId_date: {
            inventoryBatchId: id,
            date: data.date,
          },
        },
        create: {
          inventoryBatchId: id,
          sellerId,
          date: data.date,
          soldQuantity: data.soldQuantity,
          remainingQuantity: data.remainingQuantity,
          restockedQuantity: data.restockedQuantity || 0,
        },
        update: {
          soldQuantity: data.soldQuantity,
          remainingQuantity: data.remainingQuantity,
          restockedQuantity: data.restockedQuantity || 0,
        },
      });

      // Update currentQuantity on the batch to match remainingQuantity
      const updatedBatch = await tx.inventoryBatch.update({
        where: { id },
        data: { currentQuantity: data.remainingQuantity },
        include: { dailyLogs: { orderBy: { date: 'asc' } } },
      });

      return { log, updatedBatch };
    });

    // Evaluate new prediction after logging
    const prediction = evaluateBatchPrediction(result.updatedBatch);

    // Notification integration: check if recommendation notification should be sent
    if (prediction.shouldRecommendListing && prediction.recommendedListingQuantity > 0) {
      try {
        const existingNotif = await prisma.notification.findFirst({
          where: {
            userId: sellerId,
            inventoryBatchId: id,
            type: 'INVENTORY_RISK_RECOMMENDATION',
          },
          orderBy: { createdAt: 'desc' },
        });

        // Only create a notification if none exists or if significant change
        if (!existingNotif) {
          const newNotif = await prisma.notification.create({
            data: {
              userId: sellerId,
              inventoryBatchId: id,
              type: 'INVENTORY_RISK_RECOMMENDATION',
              title: 'StockBridge inventory recommendation',
              message: `Your ${batch.productName} batch may have approximately ${prediction.recommendedListingQuantity} units remaining when it enters the high-expiry-risk period. Consider listing this stock on StockBridge.`,
            },
          });

          // Emit real-time notification
          try {
            emitNotificationToUser(sellerId, {
              type: 'INVENTORY_RISK_RECOMMENDATION',
              notification: newNotif,
            });
          } catch {
            // silent socket error
          }
        }
      } catch (notifErr) {
        console.error('Notification creation error:', notifErr);
      }
    }

    res.json({
      log: result.log,
      prediction,
      batch: result.updatedBatch,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('Record daily log error:', err);
    res.status(500).json({ error: 'Failed to record daily inventory log' });
  }
});

// 8. Get history of daily logs for a batch
router.get('/:id/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const sellerId = req.user!.userId;

    const batch = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!batch || batch.sellerId !== sellerId) {
      res.status(404).json({ error: 'Inventory batch not found' });
      return;
    }

    const logs = await prisma.dailyInventoryLog.findMany({
      where: { inventoryBatchId: id },
      orderBy: { date: 'asc' },
    });

    res.json(logs);
  } catch (err) {
    console.error('Fetch batch history error:', err);
    res.status(500).json({ error: 'Failed to fetch batch daily history' });
  }
});

export default router;
