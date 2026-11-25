import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { UtensilsCrossed, Plus, Minus, ShoppingBag, CheckCircle2, QrCode, Star } from 'lucide-react';

export const CafeteriaMess: React.FC = () => {
  const { tenant } = useAuth();
  const { addNotification } = useNotifications();

  const [menu, setMenu] = useState<any[]>([]);
  const [activeMessSub, setActiveMessSub] = useState<any | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCafeteriaData();
  }, [tenant]);

  const fetchCafeteriaData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cafeteria/menu', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMenu(data.menu || []);
        setActiveMessSub(data.activeMessSub);
        setRecentOrders(data.recentOrders || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const updated = current + delta;
      if (updated <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: updated };
    });
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = menu.find(m => m.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    const items = Object.entries(cart).map(([id, qty]) => {
      const item = menu.find(m => m.id === id);
      return {
        id,
        name: item?.name,
        price: item?.price,
        qty
      };
    });

    try {
      const res = await fetch('/api/cafeteria/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          items,
          totalAmount: calculateTotal()
        })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification('Food Order Placed', data.message, 'SUCCESS');
        setCart({});
        fetchCafeteriaData();
      }
    } catch {
      alert('Order failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-campus-600" />
            Cafeteria & Mess Dining Management
          </h2>
          <p className="text-xs text-slate-500">
            Module 13: Digital food menu, token generation, monthly mess meal passes & nutritional calories
          </p>
        </div>
      </div>

      {/* Mess Subscription Card */}
      {activeMessSub && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider">Active Mess Dining Plan</span>
            <h3 className="text-lg font-black mt-0.5">{activeMessSub.plan_name}</h3>
            <p className="text-xs text-amber-100">Validity: {activeMessSub.month_year} • Status: Active Unlimited Dining</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-2 text-xs">
            <QrCode className="w-5 h-5 text-amber-200" />
            <div>
              <span className="font-mono font-bold block">{activeMessSub.qr_pass}</span>
              <span className="text-[10px] text-amber-200">Tap at Mess Gate Reader</span>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Menu & Live Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Menu */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Daily Cafeteria Food Menu</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {menu.map((item) => {
                const qty = cart[item.id] || 0;
                return (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.dietary_type === 'VEG' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.dietary_type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.calories} kcal</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{item.name}</h4>
                      <span className="text-campus-700 font-bold text-base">₹{item.price}</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">{item.category}</span>

                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <>
                            <button
                              onClick={() => updateCart(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-slate-900">{qty}</span>
                          </>
                        )}
                        <button
                          onClick={() => updateCart(item.id, 1)}
                          className="px-3 py-1.5 rounded-lg bg-campus-600 text-white font-bold text-xs"
                        >
                          {qty > 0 ? '+' : 'Add to Order'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Cart & Token Pickup */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-campus-600" />
              Kitchen Order Cart
            </h3>

            {Object.keys(cart).length > 0 ? (
              <div className="space-y-3 text-xs">
                {Object.entries(cart).map(([id, qty]) => {
                  const item = menu.find(m => m.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-slate-500 text-[10px]">₹{item.price} × {qty}</div>
                      </div>
                      <span className="font-bold text-slate-800">₹{item.price * qty}</span>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                  <span>Grand Total</span>
                  <span className="text-campus-700 text-lg">₹{calculateTotal()}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-3 rounded-2xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs shadow-md"
                >
                  Confirm & Generate Kitchen Token
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Cart is empty. Select menu items to order.</p>
            )}
          </div>

          {/* Recent Orders & Tokens */}
          {recentOrders.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Your Pickup Kitchen Tokens</h4>
              {recentOrders.map((ord) => (
                <div key={ord.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-extrabold text-base text-campus-700">Token #{ord.token_number}</span>
                    <div className="text-[11px] text-slate-500">{ord.items?.length} items • ₹{ord.total_amount}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                    {ord.order_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
