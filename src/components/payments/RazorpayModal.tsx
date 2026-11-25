import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getInstitutionName } from '../../config/university';
import { CreditCard, CheckCircle2, ShieldCheck, X, FileText, Lock, QrCode } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeDue: {
    id: string;
    fee_type: string;
    balance_amount: number;
    academic_year: string;
  } | null;
  onPaymentSuccess: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({ isOpen, onClose, feeDue, onPaymentSuccess }) => {
  const { tenant } = useAuth();
  const { addNotification } = useNotifications();

  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('aarav@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1111');
  const [processing, setProcessing] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);

  if (!isOpen || !feeDue) return null;

  const handlePayNow = async () => {
    setProcessing(true);
    try {
      // 1. Create Order
      const createRes = await fetch('/api/finance/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          feeDueId: feeDue.id,
          amount: feeDue.balance_amount
        })
      });

      const orderData = await createRes.json();

      // Simulate payment delay
      await new Promise(r => setTimeout(r, 1200));

      // 2. Verify Payment & Complete
      const verifyRes = await fetch('/api/finance/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId: 'pay_test_' + Math.random().toString(36).slice(2, 10),
          signature: 'sig_test_valid_mock_signature_' + Math.random().toString(36).slice(2, 8),
          feeDueId: feeDue.id,
          amount: feeDue.balance_amount
        })
      });

      const receipt = await verifyRes.json();
      setCompletedReceipt(receipt);
      addNotification(
        'Fee Payment Successful',
        `₹${feeDue.balance_amount.toLocaleString()} cleared for ${feeDue.fee_type}. Receipt #${receipt.receiptNumber} issued.`,
        'SUCCESS'
      );
      onPaymentSuccess();
    } catch (err: any) {
      alert('Payment processing failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Razorpay Brand Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">Razorpay Checkout</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">
                  TEST MODE
                </span>
              </div>
              <div className="text-xs text-blue-200">{getInstitutionName(tenant?.id, tenant?.name)}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!completedReceipt ? (
            <div className="space-y-5">
              {/* Amount Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Fee Category</span>
                  <div className="text-sm font-bold text-slate-900">{feeDue.fee_type.replace('_', ' ')}</div>
                  <div className="text-[11px] text-slate-400">Year: {feeDue.academic_year}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Payable Balance</span>
                  <div className="text-2xl font-black text-campus-700">
                    ₹{feeDue.balance_amount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'Instant UPI', icon: QrCode },
                    { id: 'CARD', label: 'Tokenized Card', icon: CreditCard },
                    { id: 'NETBANKING', label: 'NetBanking', icon: Lock }
                  ].map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id as any)}
                        className={`p-3 rounded-xl border text-center text-xs font-medium transition-all flex flex-col items-center gap-1.5 ${
                          paymentMode === mode.id
                            ? 'border-campus-600 bg-campus-50/70 text-campus-800 font-semibold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-campus-600" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode Detail Input */}
              {paymentMode === 'UPI' && (
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-600 font-medium">Virtual Payment Address (VPA / UPI ID)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-campus-500 font-mono"
                  />
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Auto-simulates UPI notification approval
                  </span>
                </div>
              )}

              {paymentMode === 'CARD' && (
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-600 font-medium">PCI-DSS Tokenized Mock Card</label>
                  <input
                    type="text"
                    value={cardNumber}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    Module 6 Security: Zero raw card details or CVVs are stored on campus servers.
                  </span>
                </div>
              )}

              {paymentMode === 'NETBANKING' && (
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-600 font-medium">Select Institution Bank</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800">
                    <option>HDFC Bank Corporate Portal</option>
                    <option>State Bank of India (Campus Branch)</option>
                    <option>ICICI Bank e-Payments</option>
                  </select>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayNow}
                disabled={processing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-campus-600 to-indigo-600 hover:from-campus-700 hover:to-indigo-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-campus-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Communicating with Razorpay Test Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{feeDue.balance_amount.toLocaleString()} Securely</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Digital Receipt Card */
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Payment Verified</h3>
                <p className="text-xs text-slate-500">Transaction completed via Razorpay Test Mode</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Official Receipt #:</span>
                  <span className="font-mono font-bold text-slate-900">{completedReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">₹{completedReceipt.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment ID:</span>
                  <span className="font-mono text-slate-700">{completedReceipt.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="text-slate-600">{new Date(completedReceipt.paidAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Done & Return to Ledger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
