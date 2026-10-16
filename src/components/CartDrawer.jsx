import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiCreateOrder, apiVerifyPayment, apiCancelPayment, apiFailPayment } from '../services/api';

export default function CartDrawer({ onRecipeSelect }) {
  const { cartItems, removeFromCart, clearCart, isCartOpen, setIsCartOpen, subtotal } = useCart();
  const { user, isAuthenticated, openAuthModal, refreshPurchases } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    setError('');

    if (!isAuthenticated) {
      openAuthModal('Please sign in to complete your premium recipe purchase.');
      return;
    }

    if (cartItems.length === 0) return;

    setLoading(true);

    try {
      const recipeIds = cartItems.map(item => item.id);
      const orderRes = await apiCreateOrder(recipeIds);

      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Failed to create payment order');
      }

      // Check if Razorpay is available in window
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.order.amount,
          currency: orderRes.order.currency,
          name: 'RecipeBox Premium',
          description: `Unlock ${cartItems.length} Premium Culinary Recipe(s)`,
          order_id: orderRes.order.id,
          prefill: {
            name: user.name || 'Chef',
            email: user.email || '',
            contact: user.phone || '',
          },
          theme: {
            color: '#2d6a4f',
          },
          modal: {
            ondismiss: function () {
              if (orderRes?.order?.id) {
                apiCancelPayment(orderRes.order.id, 'User closed checkout modal');
              }
              setLoading(false);
            },
          },
          handler: async function (response) {
            try {
              const verifyRes = await apiVerifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.success) {
                await refreshPurchases();
                setPaymentSuccess(true);
                clearCart();
                setTimeout(() => {
                  setPaymentSuccess(false);
                  setIsCartOpen(false);
                }, 2500);
              } else {
                throw new Error(verifyRes.error || 'Signature verification failed');
              }
            } catch (err) {
              setError(err.message || 'Payment verification failed');
            } finally {
              setLoading(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          if (orderRes?.order?.id) {
            apiFailPayment(orderRes.order.id, resp.error?.description || 'Payment declined');
          }
          setError(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
          setLoading(false);
        });
        rzp.open();
      } else {
        // Fallback simulation for sandbox environments where external script is blocked
        console.warn('Razorpay checkout script not found on window, verifying in test mode');
        const verifyRes = await apiVerifyPayment({
          razorpay_order_id: orderRes.order.id,
          razorpay_payment_id: 'pay_test_' + Date.now(),
          razorpay_signature: 'test_mock_signature',
        });

        if (verifyRes.success) {
          await refreshPurchases();
          setPaymentSuccess(true);
          clearCart();
          setTimeout(() => {
            setPaymentSuccess(false);
            setIsCartOpen(false);
          }, 2500);
        } else {
          throw new Error(verifyRes.error || 'Verification failed');
        }
      }
    } catch (err) {
      setError(err.message || 'Checkout could not be initialized');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-emerald-300" />
              <h3 className="font-serif font-bold text-lg">Culinary Cart</h3>
              <span className="bg-emerald-800 text-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                {cartItems.length}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Payment Success State */}
          {paymentSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-xl font-bold font-serif text-slate-800 mb-2">
                Payment Successful!
              </h4>
              <p className="text-sm text-slate-600 max-w-xs mb-6">
                Your premium recipes have been unlocked. You now have full access to interactive cooking timelines and multilingual voice guidance!
              </p>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full">
                Happy Cooking!
              </span>
            </div>
          ) : (
            <>
              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                      <ShoppingBag size={28} />
                    </div>
                    <h4 className="font-serif font-bold text-slate-700 text-lg mb-1">
                      Your Cart is Empty
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mb-6">
                      Explore our hand-crafted collection of premium recipes with step-by-step voice guidance for just ₹9 each.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      Browse Recipes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-200 bg-white transition-all shadow-sm"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              Premium
                            </span>
                            <span className="text-[11px] text-slate-400 truncate">
                              {item.category}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm truncate mt-0.5">
                            {item.name}
                          </h5>
                          <p className="font-bold text-emerald-800 text-sm mt-1">
                            ₹{item.price || 9}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="self-center p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove from cart"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer & Checkout */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-slate-100 bg-slate-50">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Premium Recipes ({cartItems.length})</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Interactive Voice Assistant</span>
                      <span className="text-emerald-700 font-semibold">Included FREE</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Order Total</span>
                      <span className="text-emerald-800 font-serif">₹{subtotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Connecting to Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <span>Checkout • ₹{subtotal}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Official 256-bit Secure Razorpay Checkout</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
