import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Flame,
  Calendar,
  Plus,
  Trash2,
  History,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import api from '../lib/api';
import type {
  InventoryBatch,
  InventorySummary,
  DailyInventoryLog,
} from '../types';

const CATEGORIES = [
  'Groceries',
  'Dairy & Beverages',
  'Prepared Food & Bakery',
  'Packaging',
  'Stationery',
  'Electronics',
  'Textiles',
  'Hardware',
];

const UNITS = ['kg', 'pieces', 'packets', 'bags', 'cans', 'litres', 'boxes', 'reams', 'cartons'];

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    totalBatches: 0,
    atRiskCount: 0,
    highUrgencyCount: 0,
    totalStockValueAtRisk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);

  // New Batch Form State
  const [newProductName, setNewProductName] = useState('');
  const [newCategory, setNewCategory] = useState('Groceries');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newUnit, setNewUnit] = useState('packets');
  const [newMrp, setNewMrp] = useState<number | ''>('');
  const [newCostPrice, setNewCostPrice] = useState<number | ''>('');
  const [savingBatch, setSavingBatch] = useState(false);

  // Daily Log Form State
  const [logBatchId, setLogBatchId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logSoldQty, setLogSoldQty] = useState<number>(0);
  const [logRemainingQty, setLogRemainingQty] = useState<number>(0);
  const [logRestockedQty, setLogRestockedQty] = useState<number>(0);
  const [savingLog, setSavingLog] = useState(false);

  // History Drawer State
  const [batchHistoryLogs, setBatchHistoryLogs] = useState<DailyInventoryLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch batches and predictions
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/inventory');
      setBatches(res.data.batches || []);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Open daily update modal for a specific batch or general
  const openDailyUpdateModal = (batch?: InventoryBatch) => {
    if (batch) {
      setLogBatchId(batch.id);
      setLogRemainingQty(batch.currentQuantity);
    } else if (batches.length > 0) {
      setLogBatchId(batches[0].id);
      setLogRemainingQty(batches[0].currentQuantity);
    }
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogSoldQty(0);
    setLogRestockedQty(0);
    setIsDailyLogModalOpen(true);
  };

  // Open history modal
  const openHistoryModal = async (batch: InventoryBatch) => {
    setSelectedBatch(batch);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/inventory/${batch.id}/history`);
      setBatchHistoryLogs(res.data || []);
    } catch {
      setBatchHistoryLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Submit new batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newExpiryDate || newQuantity < 0) {
      setError('Please provide a valid product name, expiry date, and quantity.');
      return;
    }

    setSavingBatch(true);
    try {
      await api.post('/inventory', {
        productName: newProductName.trim(),
        category: newCategory,
        batchNumber: newBatchNumber.trim() || undefined,
        expiryDate: newExpiryDate,
        currentQuantity: newQuantity,
        unit: newUnit,
        mrp: newMrp ? Number(newMrp) : undefined,
        costPrice: newCostPrice ? Number(newCostPrice) : undefined,
      });

      setSuccessMsg('Inventory batch created and forecasting initiated.');
      setIsAddModalOpen(false);
      // Reset form
      setNewProductName('');
      setNewBatchNumber('');
      setNewExpiryDate('');
      setNewQuantity(0);
      setNewMrp('');
      setNewCostPrice('');
      fetchInventory();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create inventory batch');
    } finally {
      setSavingBatch(false);
    }
  };

  // Submit daily log
  const handleSaveDailyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logBatchId) return;

    setSavingLog(true);
    try {
      await api.post(`/inventory/${logBatchId}/daily-log`, {
        date: logDate,
        soldQuantity: logSoldQty,
        remainingQuantity: logRemainingQty,
        restockedQuantity: logRestockedQty || 0,
      });

      setSuccessMsg("Today's sales recorded. Forecast and risk updated.");
      setIsDailyLogModalOpen(false);
      fetchInventory();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record daily log');
    } finally {
      setSavingLog(false);
    }
  };

  // Delete batch
  const handleDeleteBatch = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete inventory batch "${name}"?`)) return;
    try {
      await api.delete(`/inventory/${id}`);
      setBatches((prev) => prev.filter((b) => b.id !== id));
      setSuccessMsg('Inventory batch deleted.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete batch');
    }
  };

  // Navigate to Create Listing with prefilled query params
  const handleListOnStockBridge = (batch: InventoryBatch) => {
    const pred = batch.prediction;
    const recommendedQty = pred ? pred.recommendedListingQuantity : batch.currentQuantity;
    const expiryStr = batch.expiryDate ? batch.expiryDate.split('T')[0] : '';

    const params = new URLSearchParams({
      title: batch.productName,
      category: batch.category,
      quantity: String(recommendedQty),
      unit: batch.unit,
      expiryDate: expiryStr,
      fromInventory: batch.id,
    });

    if (batch.mrp) {
      params.append('mrp', String(batch.mrp));
    }

    navigate(`/create-listing?${params.toString()}`);
  };

  const recommendations = batches.filter(
    (b) => b.prediction?.shouldRecommendListing && b.prediction?.canListOnStockBridge
  );

  return (
    <div style={{ background: 'var(--sb-background, #F7F7F2)', minHeight: '100vh', color: 'var(--sb-text-primary, #182018)', paddingBottom: 80 }}>
      {/* Header Bar */}
      <div style={{ background: 'var(--sb-surface, #FFFFFF)', borderBottom: '1px solid var(--sb-border, #D8E0D5)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 6,
                  background: 'var(--sb-primary-pale, #EAF1E7)',
                  border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={20} color="var(--sb-primary, #6F8F69)" />
                </div>
                <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--sb-text-primary, #182018)', margin: 0, letterSpacing: '-0.01em' }}>
                  Smart Inventory Risk Predictor
                </h1>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: 'var(--sb-primary-pale, #EAF1E7)', color: 'var(--sb-primary, #6F8F69)',
                  padding: '3px 8px', borderRadius: 4, border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                }}>
                  LWMA Forecasting
                </span>
              </div>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)', margin: 0, maxWidth: 680 }}>
                Track store sales and stock levels. StockBridge uses weighted sales velocity to predict dead-stock risk before high urgency begins, recommending timely liquidation.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => openDailyUpdateModal()}
                disabled={batches.length === 0}
                className="stitch-btn-ghost"
                style={{
                  padding: '10px 16px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: batches.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: batches.length === 0 ? 0.5 : 1,
                }}
              >
                <Calendar size={16} />
                <span>Daily Store Update</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="stitch-btn-primary"
                style={{
                  padding: '10px 18px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                <span>Add Store Batch</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 1,
            background: 'var(--sb-border, #D8E0D5)',
            borderRadius: 8,
            overflow: 'hidden',
            marginTop: 28,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}>
            <div style={{ background: 'var(--sb-surface, #FFFFFF)', padding: '18px 20px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tracked Batches
              </span>
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--sb-text-primary, #182018)', margin: '6px 0 0' }}>
                {summary.totalBatches}
              </p>
            </div>

            <div style={{ background: 'var(--sb-surface, #FFFFFF)', padding: '18px 20px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-danger, #A65C55)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertTriangle size={12} color="var(--sb-danger, #A65C55)" /> Batches at Risk
              </span>
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--sb-danger, #A65C55)', margin: '6px 0 0' }}>
                {summary.atRiskCount}
              </p>
            </div>

            <div style={{ background: 'var(--sb-surface, #FFFFFF)', padding: '18px 20px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-warning, #B88A45)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Flame size={12} color="var(--sb-warning, #B88A45)" /> High Urgency Window
              </span>
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--sb-warning, #B88A45)', margin: '6px 0 0' }}>
                {summary.highUrgencyCount}
              </p>
            </div>

            <div style={{ background: 'var(--sb-surface, #FFFFFF)', padding: '18px 20px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-primary, #6F8F69)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Est. Value at Risk
              </span>
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--sb-primary, #6F8F69)', margin: '6px 0 0' }}>
                ₹{summary.totalStockValueAtRisk.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Alerts */}
        {error && (
          <div style={{
            background: 'rgba(166,92,85,0.08)',
            border: '1px solid rgba(166,92,85,0.25)',
            borderRadius: 6,
            padding: '12px 16px',
            color: 'var(--sb-danger, #A65C55)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <AlertTriangle size={16} />
            <span style={{ fontSize: 13 }}>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'var(--sb-primary-pale, #EAF1E7)',
            border: '1px solid var(--sb-primary-soft, #DCE8D8)',
            borderRadius: 6,
            padding: '12px 16px',
            color: 'var(--sb-primary, #6F8F69)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <CheckCircle2 size={16} />
            <span style={{ fontSize: 13 }}>{successMsg}</span>
          </div>
        )}

        {/* Section 1: Smart Inventory Insights (Recommendations) */}
        {recommendations.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Sparkles size={20} color="var(--sb-primary, #6F8F69)" />
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>
                Smart Inventory Insights & Recommended Actions
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
              {recommendations.map((batch) => {
                const pred = batch.prediction!;
                return (
                  <div
                    key={batch.id}
                    style={{
                      background: 'var(--sb-surface, #FFFFFF)',
                      border: `1px solid ${pred.riskLevel === 'HIGH' ? 'rgba(166,92,85,0.35)' : 'var(--sb-border, #D8E0D5)'}`,
                      borderRadius: 8,
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {batch.category} {batch.batchNumber ? `· Batch ${batch.batchNumber}` : ''}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4,
                            background: pred.riskLevel === 'HIGH' ? 'rgba(166,92,85,0.1)' : 'rgba(184,138,69,0.1)',
                            color: pred.riskLevel === 'HIGH' ? 'var(--sb-danger, #A65C55)' : 'var(--sb-warning, #B88A45)',
                            border: `1px solid ${pred.riskLevel === 'HIGH' ? 'rgba(166,92,85,0.25)' : 'rgba(184,138,69,0.25)'}`,
                          }}>
                            {pred.riskLevel} Risk
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4,
                            background: 'var(--sb-surface-soft, #F2F6EF)', color: 'var(--sb-text-secondary, #4F5A51)', border: '1px solid var(--sb-border, #D8E0D5)',
                          }}>
                            {pred.confidence} Confidence
                          </span>
                        </div>
                      </div>

                      <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: '0 0 16px' }}>
                        {batch.productName}
                      </h3>

                      {/* Key Forecast Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                        <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--sb-border, #D8E0D5)' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase' }}>Current Stock</span>
                          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--sb-text-primary, #182018)', margin: '3px 0 0' }}>
                            {batch.currentQuantity} {batch.unit}
                          </p>
                        </div>
                        <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--sb-border, #D8E0D5)' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase' }}>Avg Daily Sales</span>
                          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--sb-primary, #6F8F69)', margin: '3px 0 0' }}>
                            {pred.averageDailySales} {batch.unit}/day
                          </p>
                        </div>
                        <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--sb-border, #D8E0D5)' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase' }}>Expiry Countdown</span>
                          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--sb-text-primary, #182018)', margin: '3px 0 0' }}>
                            {pred.daysUntilExpiry} days left
                          </p>
                        </div>
                        <div style={{ background: 'var(--sb-surface-soft, #F2F6EF)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--sb-border, #D8E0D5)' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase' }}>High Urgency In</span>
                          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: pred.daysUntilHighUrgency === 0 ? 'var(--sb-danger, #A65C55)' : 'var(--sb-warning, #B88A45)', margin: '3px 0 0' }}>
                            {pred.daysUntilHighUrgency === 0 ? 'Active Now' : `${pred.daysUntilHighUrgency} days`}
                          </p>
                        </div>
                      </div>

                      {/* Explainable Reasoning */}
                      <div style={{ background: 'var(--sb-primary-pale, #EAF1E7)', border: '1px solid var(--sb-primary-soft, #DCE8D8)', borderRadius: 6, padding: '12px 14px', marginBottom: 18 }}>
                        <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-secondary, #4F5A51)', lineHeight: 1.5, margin: 0 }}>
                          {pred.reason}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => handleListOnStockBridge(batch)}
                        className="stitch-btn-primary"
                        style={{
                          width: '100%',
                          padding: '11px 16px',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <span>List {pred.recommendedListingQuantity} {batch.unit} on StockBridge</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Store Inventory Batches Table */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Layers size={18} color="var(--sb-primary, #6F8F69)" />
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>
                Store Inventory Batches
              </h2>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
              <Loader2 size={24} color="var(--sb-primary, #6F8F69)" className="animate-spin" />
              <span style={{ fontSize: 14, color: 'var(--sb-text-secondary, #4F5A51)' }}>Loading store inventory batches...</span>
            </div>
          ) : batches.length === 0 ? (
            <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, padding: '60px 24px', textAlign: 'center' }}>
              <Package size={36} color="var(--sb-text-muted, #7A847A)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, color: 'var(--sb-text-primary, #182018)', margin: '0 0 6px' }}>
                No store inventory batches tracked yet
              </h3>
              <p style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', maxWidth: 460, margin: '0 auto 20px' }}>
                Add your physical store inventory batches to begin automatic risk forecasting and get early liquidation recommendations.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="stitch-btn-primary"
                style={{ padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                + Add Your First Batch
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                <thead>
                  <tr style={{ background: 'var(--sb-surface-soft, #F2F6EF)', borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Stock</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiry Date</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sales Velocity</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Level</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forecast Status</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sb-text-muted, #7A847A)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => {
                    const pred = batch.prediction;
                    const expiryStr = batch.expiryDate ? batch.expiryDate.split('T')[0] : 'N/A';
                    return (
                      <tr key={batch.id} style={{ borderBottom: '1px solid var(--sb-border, #D8E0D5)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>
                            {batch.productName}
                          </p>
                          <span style={{ fontSize: 11, color: 'var(--sb-text-muted, #7A847A)' }}>
                            {batch.category} {batch.batchNumber ? `· Batch ${batch.batchNumber}` : ''}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--sb-text-primary, #182018)' }}>
                            {batch.currentQuantity}
                          </span>{' '}
                          <span style={{ fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>{batch.unit}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontSize: 13, color: 'var(--sb-text-primary, #182018)', margin: 0 }}>{expiryStr}</p>
                          <span style={{ fontSize: 11, color: (pred?.daysUntilExpiry ?? 0) <= 25 ? 'var(--sb-danger, #A65C55)' : 'var(--sb-text-muted, #7A847A)' }}>
                            {pred?.daysUntilExpiry !== null ? `${pred?.daysUntilExpiry} days left` : ''}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--sb-primary, #6F8F69)' }}>
                            {pred?.averageDailySales ?? 0} {batch.unit}/day
                          </span>
                          <span style={{ display: 'block', fontSize: 10, color: 'var(--sb-text-muted, #7A847A)' }}>
                            {pred?.historyDaysCount ? `Based on ${pred.historyDaysCount}d history` : 'No logs yet'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
                            background: pred?.riskLevel === 'HIGH' ? 'rgba(166,92,85,0.1)' : pred?.riskLevel === 'MEDIUM' ? 'rgba(184,138,69,0.1)' : 'var(--sb-primary-pale, #EAF1E7)',
                            color: pred?.riskLevel === 'HIGH' ? 'var(--sb-danger, #A65C55)' : pred?.riskLevel === 'MEDIUM' ? 'var(--sb-warning, #B88A45)' : 'var(--sb-primary, #6F8F69)',
                            border: `1px solid ${pred?.riskLevel === 'HIGH' ? 'rgba(166,92,85,0.25)' : pred?.riskLevel === 'MEDIUM' ? 'rgba(184,138,69,0.25)' : 'var(--sb-primary-soft, #DCE8D8)'}`,
                          }}>
                            {pred?.riskLevel || 'LOW'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {pred?.shouldRecommendListing ? (
                            <span style={{ fontSize: 12, color: 'var(--sb-danger, #A65C55)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <AlertTriangle size={13} /> Recommend {pred.recommendedListingQuantity} on marketplace
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>
                              {pred?.confidence === 'insufficient' ? 'Need more history' : 'On pace to clear'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => openDailyUpdateModal(batch)}
                              className="stitch-btn-ghost"
                              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}
                              title="Update Today's Sales"
                            >
                              Log Sales
                            </button>

                            <button
                              type="button"
                              onClick={() => openHistoryModal(batch)}
                              className="stitch-btn-ghost"
                              style={{ padding: '6px 8px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}
                              title="View History"
                            >
                              <History size={14} />
                            </button>

                            {pred?.shouldRecommendListing && pred.canListOnStockBridge && (
                              <button
                                type="button"
                                onClick={() => handleListOnStockBridge(batch)}
                                className="stitch-btn-primary"
                                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}
                                title="List Recommended Excess on StockBridge"
                              >
                                List Stock
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteBatch(batch.id, batch.productName)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--sb-danger, #A65C55)', opacity: 0.7, padding: 6, cursor: 'pointer' }}
                              title="Delete Batch"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Add Store Batch */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,32,24,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, width: '100%', maxWidth: 520, padding: 28, position: 'relative', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--sb-text-muted, #7A847A)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: '0 0 6px' }}>
              Add Store Inventory Batch
            </h3>
            <p style={{ fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', margin: '0 0 20px' }}>
              Track a private product lot in your physical store for expiry risk prediction.
            </p>

            <form onSubmit={handleCreateBatch}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. Parle-G Gold 100g Biscuits"
                    required
                    style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Category *
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Batch Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={newBatchNumber}
                      onChange={(e) => setNewBatchNumber(e.target.value)}
                      placeholder="e.g. BATCH-2026-A"
                      style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newQuantity || ''}
                      onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 100"
                      required
                      style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Unit *
                    </label>
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    required
                    style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      MRP (₹) (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newMrp}
                      onChange={(e) => setNewMrp(e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="e.g. 50"
                      style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Cost Price (₹) (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newCostPrice}
                      onChange={(e) => setNewCostPrice(e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="e.g. 38"
                      style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="stitch-btn-ghost"
                    style={{ padding: '10px 18px', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBatch}
                    className="stitch-btn-primary"
                    style={{ padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: savingBatch ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {savingBatch && <Loader2 size={14} className="animate-spin" />}
                    <span>Save Store Batch</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Daily Store Update */}
      {isDailyLogModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,32,24,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, width: '100%', maxWidth: 480, padding: 28, position: 'relative', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}>
            <button
              type="button"
              onClick={() => setIsDailyLogModalOpen(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--sb-text-muted, #7A847A)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: '0 0 6px' }}>
              Daily Store Update
            </h3>
            <p style={{ fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', margin: '0 0 20px' }}>
              Record daily sales and remaining stock to update velocity and risk forecasts.
            </p>

            <form onSubmit={handleSaveDailyLog}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Product Batch *
                  </label>
                  <select
                    value={logBatchId}
                    onChange={(e) => {
                      setLogBatchId(e.target.value);
                      const b = batches.find((item) => item.id === e.target.value);
                      if (b) setLogRemainingQty(b.currentQuantity);
                    }}
                    required
                    style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.productName} ({b.currentQuantity} {b.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                    style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Sold Today *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={logSoldQty}
                      onChange={(e) => {
                        const s = parseFloat(e.target.value) || 0;
                        setLogSoldQty(s);
                        const b = batches.find((item) => item.id === logBatchId);
                        if (b) {
                          setLogRemainingQty(Math.max(0, b.currentQuantity - s + (logRestockedQty || 0)));
                        }
                      }}
                      required
                      style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Remaining Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={logRemainingQty}
                      onChange={(e) => setLogRemainingQty(parseFloat(e.target.value) || 0)}
                      required
                      style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text-secondary, #4F5A51)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Stock Restocked / Added Today (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={logRestockedQty || ''}
                    onChange={(e) => {
                      const r = parseFloat(e.target.value) || 0;
                      setLogRestockedQty(r);
                      const b = batches.find((item) => item.id === logBatchId);
                      if (b) {
                        setLogRemainingQty(Math.max(0, b.currentQuantity - logSoldQty + r));
                      }
                    }}
                    placeholder="0"
                    style={{ width: '100%', background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 4, padding: '10px 12px', color: 'var(--sb-text-primary, #182018)', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setIsDailyLogModalOpen(false)}
                    className="stitch-btn-ghost"
                    style={{ padding: '10px 18px', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingLog}
                    className="stitch-btn-primary"
                    style={{ padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: savingLog ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {savingLog && <Loader2 size={14} className="animate-spin" />}
                    <span>Save Daily Update</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: History Drawer */}
      {isHistoryModalOpen && selectedBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,32,24,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--sb-surface, #FFFFFF)', border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 8, width: '100%', maxWidth: 560, padding: 28, position: 'relative', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}>
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--sb-text-muted, #7A847A)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sb-text-primary, #182018)', margin: '0 0 4px' }}>
              Sales History: {selectedBatch.productName}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--sb-text-secondary, #4F5A51)', margin: '0 0 16px' }}>
              Recent daily logs used to calculate weighted sales velocity.
            </p>

            {loadingHistory ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 size={24} color="var(--sb-primary, #6F8F69)" className="animate-spin" />
              </div>
            ) : batchHistoryLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--sb-text-muted, #7A847A)', fontSize: 13 }}>
                No daily logs recorded yet for this batch.
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--sb-border, #D8E0D5)', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--sb-surface-soft, #F2F6EF)', borderBottom: '1px solid var(--sb-border, #D8E0D5)', color: 'var(--sb-text-muted, #7A847A)', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Date</th>
                      <th style={{ padding: '10px 14px' }}>Sold</th>
                      <th style={{ padding: '10px 14px' }}>Remaining</th>
                      <th style={{ padding: '10px 14px' }}>Restocked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchHistoryLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--sb-border, #D8E0D5)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--sb-text-primary, #182018)' }}>{log.date}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--sb-primary, #6F8F69)', fontWeight: 600 }}>{log.soldQuantity} {selectedBatch.unit}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--sb-text-primary, #182018)' }}>{log.remainingQuantity} {selectedBatch.unit}</td>
                        <td style={{ padding: '10px 14px', color: log.restockedQuantity > 0 ? 'var(--sb-warning, #B88A45)' : 'var(--sb-text-muted, #7A847A)' }}>
                          {log.restockedQuantity > 0 ? `+${log.restockedQuantity}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="stitch-btn-ghost"
                style={{ padding: '8px 18px', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
