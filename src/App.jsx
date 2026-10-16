import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, Search, Clock, ChefHat, Flame, Leaf, Utensils, Check, Plus, Minus, 
  X, Trash2, Calendar, ShoppingBag, ShoppingCart, RotateCcw, Play, Pause, 
  ChevronRight, ChevronLeft, ArrowRight, Sparkles, Filter, CheckCircle2, 
  AlertCircle, Sun, Coffee, Moon, Award, Info, Share2, Printer, Eye, Volume2, VolumeX, Menu,
  MousePointer, Wand2, ChevronUp, ChevronDown
} from 'lucide-react';

// --- DATA & ASSISTANT ---
import RECIPES_DATA from './data/recipes.json';
import HERO_IMAGE from './data/heroImage.js';
import { useVoiceAssistant } from './hooks/useVoiceAssistant.js';
import VoiceCookingAssistant from './components/VoiceCookingAssistant.jsx';

// --- AUTH & COMMERCE ---
import { useAuth } from './context/AuthContext.jsx';
import { useCart } from './context/CartContext.jsx';
import AuthModal from './components/AuthModal.jsx';
import UserProfileMenu from './components/UserProfileMenu.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import { apiCreateOrder, apiVerifyPayment, apiCancelPayment, apiFailPayment } from './services/api.js';

const PREMIUM_RECIPE_IDS = new Set([
  'paneer-butter-masala',
  'mushroom-pasta',
  'chocolate-brownies',
  'vegetable-biryani',
]);

// --- VEGETABLE SVG ILLUSTRATIONS ---
const CarrotIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19 13L26 6M22 10L27 9M20 7L24 2" stroke="#4D9662" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18.5 10.5C21 13 18 19 12 25C9 28 6 30 5 30C5 29 7 26 10 23C16 17 16 11 18.5 10.5Z" fill="#E89A55" stroke="#C87A35" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M11 20C12 21 14 20.5 15 20M14 16C15 17 17 16.5 18 16" stroke="#C87A35" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const TomatoIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8C16 5 18 3 19 2M16 8L13 5M16 8L19 6M16 8L13 9M16 8L19 10" stroke="#4D9662" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="16" cy="18" r="11" fill="#E05345" stroke="#C2382A" strokeWidth="1.5"/>
    <ellipse cx="13" cy="15" rx="3" ry="1.5" fill="#FFA59E" opacity="0.6"/>
  </svg>
);

const MushroomIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4C9 4 5 10 5 16C5 17.5 7 18 16 18C25 18 27 17.5 27 16C27 10 23 4 16 4Z" fill="#D4B69B" stroke="#A88768" strokeWidth="1.5"/>
    <circle cx="10" cy="11" r="2" fill="#FFFFFF" opacity="0.7"/>
    <circle cx="18" cy="9" r="2.5" fill="#FFFFFF" opacity="0.7"/>
    <circle cx="22" cy="13" r="1.5" fill="#FFFFFF" opacity="0.7"/>
    <path d="M12 18V26C12 27.5 13.5 29 16 29C18.5 29 20 27.5 20 26V18" fill="#F0E4D7" stroke="#A88768" strokeWidth="1.5"/>
  </svg>
);

const BasilLeafIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M6 26C8 21 13 18 19 14C25 10 28 6 28 6C28 6 24 9 19 15C14 21 11 26 6 26Z" stroke="#3A633F" strokeWidth="1.5"/>
    <path d="M6 26C12 27 22 25 26 15C28 10 28 6 28 6C28 6 22 7 15 13C8 19 6 24 6 26Z" fill="#66856A" stroke="#4D6B51" strokeWidth="1.5"/>
    <path d="M13 18C15 16 18 16 20 17M17 14C19 12 22 12 24 13" stroke="#87A88B" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const BellPepperIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M16 6C16 3 17 2 19 2" stroke="#4D9662" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 8C7 8 5 11 5 17C5 25 9 29 12 29C14 29 14 27 16 27C18 27 18 29 20 29C23 29 27 25 27 17C27 11 25 8 22 8C19 8 18 10 16 10C14 10 13 8 10 8Z" fill="#E89A55" stroke="#C87A35" strokeWidth="1.5"/>
    <ellipse cx="10" cy="14" rx="2" ry="4" fill="#FFAE73" opacity="0.5"/>
  </svg>
);

// --- AUDIO SYNTHESIZER ---
let audioCtx = null;
const playTone = (freq, type = 'sine', duration = 0.15, gainVal = 0.1) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context not allowed or blocked
  }
};

const playChimeSound = (soundEnabled) => {
  if (!soundEnabled) return;
  playTone(523.25, 'triangle', 0.2, 0.15); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.35, 0.12), 120); // E5
};

const playTimerChime = (soundEnabled) => {
  if (!soundEnabled) return;
  playTone(659.25, 'triangle', 0.25, 0.2);
  setTimeout(() => playTone(880, 'sine', 0.4, 0.2), 180);
};

const playClickSound = (soundEnabled) => {
  if (!soundEnabled) return;
  playTone(784, 'sine', 0.08, 0.08);
};

const formatQuantity = (qty) => {
  if (qty === null || qty === undefined || qty === '') return '';
  const num = typeof qty === 'number' ? qty : parseFloat(qty);
  if (isNaN(num)) return qty.toString();
  if (num <= 0) return '0';

  const whole = Math.floor(num);
  const remainder = num - whole;
  const eps = 0.04;

  let fractionStr = '';
  if (Math.abs(remainder - 0.25) < eps) fractionStr = '1/4';
  else if (Math.abs(remainder - 0.333) < eps) fractionStr = '1/3';
  else if (Math.abs(remainder - 0.5) < eps) fractionStr = '1/2';
  else if (Math.abs(remainder - 0.666) < eps) fractionStr = '2/3';
  else if (Math.abs(remainder - 0.75) < eps) fractionStr = '3/4';
  else if (remainder >= 1 - eps) return (whole + 1).toString();
  else if (remainder > eps) {
    const rounded = Math.round(num * 10) / 10;
    return rounded.toString();
  }

  if (fractionStr) {
    return whole > 0 ? `${whole} ${fractionStr}` : fractionStr;
  }
  return whole.toString();
};

export default function App() {
  // Auth & Cart State
  const { user, isAuthenticated, openAuthModal, purchasedRecipeIds, refreshPurchases } = useAuth();
  const { cartCount, setIsCartOpen, addToCart } = useCart();

  // Navigation & View
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hero Culinary Showcase Carousel
  const [heroActiveIndex, setHeroActiveIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const featuredHeroRecipes = useMemo(() => RECIPES_DATA.slice(0, 6), []);

  useEffect(() => {
    if (heroPaused) return;
    const interval = setInterval(() => {
      setHeroActiveIndex(prev => (prev + 1) % featuredHeroRecipes.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroPaused, featuredHeroRecipes.length]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDietary, setSelectedDietary] = useState('All');
  const [selectedPrepTime, setSelectedPrepTime] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');

  // Favorites (Stored in localStorage)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('recipebox_favorites');
      return saved ? JSON.parse(saved) : ['paneer-butter-masala', 'vegetable-pasta', 'tomato-soup'];
    } catch {
      return ['paneer-butter-masala', 'vegetable-pasta', 'tomato-soup'];
    }
  });

  // Meal Planner (7 days, Stored in localStorage)
  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('recipebox_meal_plan');
      if (saved) return JSON.parse(saved);
      return {
        Mon: { breakfast: 'pancakes', lunch: 'paneer-butter-masala', dinner: 'vegetable-pasta' },
        Tue: { breakfast: 'masala-dosa', lunch: 'garden-salad', dinner: 'chickpea-curry' },
        Wed: { breakfast: null, lunch: 'fried-rice', dinner: 'tomato-soup' },
        Thu: { breakfast: 'pancakes', lunch: null, dinner: 'mushroom-pasta' },
        Fri: { breakfast: null, lunch: 'chickpea-curry', dinner: 'vegetable-biryani' },
        Sat: { breakfast: 'masala-dosa', lunch: 'vegetable-pasta', dinner: 'grilled-chicken' },
        Sun: { breakfast: 'pancakes', lunch: 'vegetable-biryani', dinner: 'chocolate-brownies' }
      };
    } catch {
      return { Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {}, Sat: {}, Sun: {} };
    }
  });
  const [activeDay, setActiveDay] = useState('Mon');
  const [mealModalSlot, setMealModalSlot] = useState(null); // { day: 'Mon', meal: 'breakfast' }

  // Recipe Details Modal
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [detailServings, setDetailServings] = useState(4);
  const [detailCheckedIngredients, setDetailCheckedIngredients] = useState({});

  // Cooking Mode
  const [cookingRecipeId, setCookingRecipeId] = useState('paneer-butter-masala');
  const [allCookingProgress, setAllCookingProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('recipebox_cooking_progress');
      if (saved) return JSON.parse(saved);
      return {
        'paneer-butter-masala': { completedSteps: [1, 2], activeStep: 3, isFinished: false }
      };
    } catch {
      return {};
    }
  });

  // Active cooking recipe object
  const currentCookingRecipe = useMemo(() => {
    return RECIPES_DATA.find(r => r.id === cookingRecipeId) || RECIPES_DATA[0];
  }, [cookingRecipeId]);

  const currentRecipeProgress = useMemo(() => {
    return allCookingProgress[cookingRecipeId] || { completedSteps: [], activeStep: 1, isFinished: false };
  }, [allCookingProgress, cookingRecipeId]);

  // Cooking Step Timer State
  const [stepTimers, setStepTimers] = useState({}); // { [stepId]: { timeLeft, isRunning, initial } }

  // Snake Timeline Dynamic Measurements
  const timelineContainerRef = useRef(null);
  const [stepNodeCoords, setStepNodeCoords] = useState([]);

  useEffect(() => {
    const updateCoords = () => {
      if (!timelineContainerRef.current) return;
      const containerRect = timelineContainerRef.current.getBoundingClientRect();
      const coords = currentCookingRecipe.steps.map(step => {
        const el = document.getElementById(`step-node-${step.id}`);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          id: step.id,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2
        };
      });
      setStepNodeCoords(coords.filter(Boolean));
    };

    updateCoords();
    const timer = setTimeout(updateCoords, 100);
    window.addEventListener('resize', updateCoords);

    let ro;
    if (typeof ResizeObserver !== 'undefined' && timelineContainerRef.current) {
      ro = new ResizeObserver(updateCoords);
      ro.observe(timelineContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCoords);
      if (ro) ro.disconnect();
    };
  }, [cookingRecipeId, currentCookingRecipe, stepTimers, allCookingProgress]);

  // Toast & Modals
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: () => {} });

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('recipebox_favorites', JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('recipebox_meal_plan', JSON.stringify(mealPlan));
    } catch (e) {}
  }, [mealPlan]);

  useEffect(() => {
    try {
      localStorage.setItem('recipebox_cooking_progress', JSON.stringify(allCookingProgress));
    } catch (e) {}
  }, [allCookingProgress]);

  // Toast auto-hide
  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Direct ₹9 Buy Now payment flow
  const handleBuyNow = async (recipe) => {
    if (!isAuthenticated) {
      openAuthModal(`Sign in to unlock ${recipe.name} for ₹9.`);
      return;
    }

    try {
      showToast('Creating secure payment order...');
      const orderRes = await apiCreateOrder([recipe.id]);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Failed to initialize order');
      }

      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.order.amount,
          currency: orderRes.order.currency,
          name: 'RecipeBox Premium',
          description: `Unlock ${recipe.name}`,
          order_id: orderRes.order.id,
          prefill: {
            name: user.name || 'Chef',
            email: user.email || '',
            contact: user.phone || '',
          },
          theme: { color: '#2d6a4f' },
          modal: {
            ondismiss: function () {
              if (orderRes?.order?.id) {
                apiCancelPayment(orderRes.order.id, 'User closed checkout');
              }
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
                showToast(`🎉 ${recipe.name} unlocked! Bon appétit!`);
              }
            } catch (err) {
              showToast(err.message || 'Payment verification failed');
            }
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          if (orderRes?.order?.id) {
            apiFailPayment(orderRes.order.id, resp.error?.description || 'Payment declined');
          }
          showToast(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
        });
        rzp.open();
      } else {
        const verifyRes = await apiVerifyPayment({
          razorpay_order_id: orderRes.order.id,
          razorpay_payment_id: 'pay_test_' + Date.now(),
          razorpay_signature: 'test_mock_signature',
        });
        if (verifyRes.success) {
          await refreshPurchases();
          showToast(`🎉 ${recipe.name} unlocked! Bon appétit!`);
        }
      }
    } catch (err) {
      showToast(err.message || 'Could not complete purchase');
    }
  };



  // Timer Interval Hook for Cooking Mode
  useEffect(() => {
    const interval = setInterval(() => {
      setStepTimers(prev => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach(stepId => {
          if (next[stepId]?.isRunning && next[stepId].timeLeft > 0) {
            changed = true;
            next[stepId] = {
              ...next[stepId],
              timeLeft: next[stepId].timeLeft - 1
            };
            if (next[stepId].timeLeft === 0) {
              next[stepId].isRunning = false;
              playTimerChime(soundEnabled);
              showToast("Timer completed! Check on your step.", "info");
            }
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Smooth Scroll Helper
  const scrollToSection = (id) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Favorite toggle
  const toggleFavorite = (recipeId, e) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const exists = prev.includes(recipeId);
      const next = exists ? prev.filter(id => id !== recipeId) : [...prev, recipeId];
      showToast(exists ? 'Removed from favorites' : 'Saved to favorites! ❤️');
      return next;
    });
  };

  // Open recipe details
  const openRecipeDetails = (recipe) => {
    setDetailRecipe(recipe);
    setDetailServings(recipe.servings || 4);
    setDetailCheckedIngredients({});
  };

  // Scale ingredient quantity
  const getScaledQuantity = (baseQty, baseServings, currentServings) => {
    if (!baseQty) return '';
    const ratio = currentServings / (baseServings || 4);
    return formatQuantity(baseQty * ratio);
  };



  // Launch cooking mode with specific recipe
  const startCookingRecipe = (recipe) => {
    setCookingRecipeId(recipe.id);
    if (detailRecipe) setDetailRecipe(null);
    scrollToSection('cooking-mode');
    showToast(`Loaded ${recipe.name} into Cooking Mode! 🍳`);
  };

  // Cooking Mode Step Completion
  const markStepComplete = (stepId) => {
    const totalSteps = currentCookingRecipe.steps.length;
    setAllCookingProgress(prev => {
      const prog = prev[cookingRecipeId] || { completedSteps: [], activeStep: 1, isFinished: false };
      const completed = prog.completedSteps.includes(stepId) 
        ? prog.completedSteps 
        : [...prog.completedSteps, stepId];
      
      const nextStep = stepId + 1 <= totalSteps ? stepId + 1 : stepId;
      const isFinished = completed.length >= totalSteps;

      return {
        ...prev,
        [cookingRecipeId]: {
          completedSteps: completed,
          activeStep: nextStep,
          isFinished
        }
      };
    });

    playChimeSound(soundEnabled);
    showToast(`Step ${stepId} completed! Great job 🌿`);
  };

  // Toggle step uncomplete
  const toggleStepCompleted = (stepId) => {
    setAllCookingProgress(prev => {
      const prog = prev[cookingRecipeId] || { completedSteps: [], activeStep: 1, isFinished: false };
      const exists = prog.completedSteps.includes(stepId);
      const completed = exists 
        ? prog.completedSteps.filter(s => s !== stepId)
        : [...prog.completedSteps, stepId];
      
      return {
        ...prev,
        [cookingRecipeId]: {
          ...prog,
          completedSteps: completed,
          isFinished: completed.length >= currentCookingRecipe.steps.length
        }
      };
    });
  };

  // Reset cooking progress with confirmation
  const handleResetCooking = () => {
    setConfirmModal({
      show: true,
      title: 'Reset Cooking Progress?',
      message: `Are you sure you want to reset your progress for "${currentCookingRecipe.name}"? This will clear all completed checkpoints.`,
      onConfirm: () => {
        setAllCookingProgress(prev => ({
          ...prev,
          [cookingRecipeId]: { completedSteps: [], activeStep: 1, isFinished: false }
        }));
        setConfirmModal(prev => ({ ...prev, show: false }));
        showToast('Cooking progress has been reset.');
      }
    });
  };

  // Multilingual Voice Assistant Hook
  const voiceAssistant = useVoiceAssistant({
    recipe: currentCookingRecipe,
    activeStepId: currentRecipeProgress.activeStep || 1,
    setActiveStepId: (stepId) => {
      setAllCookingProgress(prev => ({
        ...prev,
        [cookingRecipeId]: {
          ...(prev[cookingRecipeId] || {}),
          activeStep: stepId
        }
      }));
    },
    markStepComplete,
    onStepChange: (stepId) => {
      const stepEl = document.getElementById(`cooking-step-${stepId}`);
      if (stepEl) stepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    showToast
  });

  // Filtered & Sorted Recipes for Explore
  const filteredRecipes = useMemo(() => {
    return RECIPES_DATA.filter(recipe => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = recipe.name.toLowerCase().includes(q);
        const matchesDesc = recipe.description.toLowerCase().includes(q);
        const matchesIng = recipe.ingredients.some(i => i.name.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesIng) return false;
      }
      // Cuisine
      if (selectedCuisine !== 'All' && recipe.cuisine !== selectedCuisine) return false;
      // Dietary
      if (selectedDietary !== 'All' && recipe.dietaryType !== selectedDietary) return false;
      // Prep Time
      const totalTime = recipe.prepTime + recipe.cookTime;
      if (selectedPrepTime === 'under-15' && totalTime > 15) return false;
      if (selectedPrepTime === '15-30' && (totalTime < 15 || totalTime > 30)) return false;
      if (selectedPrepTime === '30-60' && (totalTime < 30 || totalTime > 60)) return false;
      if (selectedPrepTime === 'over-60' && totalTime <= 60) return false;
      // Difficulty
      if (selectedDifficulty !== 'All' && recipe.difficulty !== selectedDifficulty) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'time-asc') return (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime);
      if (sortBy === 'time-desc') return (b.prepTime + b.cookTime) - (a.prepTime + a.cookTime);
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return b.rating - a.rating; // popularity
    });
  }, [searchQuery, selectedCuisine, selectedDietary, selectedPrepTime, selectedDifficulty, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCuisine('All');
    setSelectedDietary('All');
    setSelectedPrepTime('All');
    setSelectedDifficulty('All');
    setSortBy('popularity');
    showToast('Filters cleared.');
  };

  // Favorited recipe items
  const favoriteRecipes = useMemo(() => {
    return RECIPES_DATA.filter(r => favorites.includes(r.id));
  }, [favorites]);



  // Clear meal plan
  const clearWeekMealPlan = () => {
    setConfirmModal({
      show: true,
      title: 'Clear Weekly Meal Plan?',
      message: 'Are you sure you want to clear your planned meals for all 7 days?',
      onConfirm: () => {
        setMealPlan({ Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {}, Sat: {}, Sun: {} });
        setConfirmModal(prev => ({ ...prev, show: false }));
        showToast('Weekly meal plan reset.');
      }
    });
  };

  // Assign recipe to meal plan
  const assignRecipeToMeal = (recipeId) => {
    if (!mealModalSlot) return;
    const { day, meal } = mealModalSlot;
    setMealPlan(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [meal]: recipeId
      }
    }));
    setMealModalSlot(null);
    showToast(`Assigned to ${day} ${meal.charAt(0).toUpperCase() + meal.slice(1)}! 📅`);
  };

  // Remove meal from plan
  const removeMealFromPlan = (day, meal) => {
    setMealPlan(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [meal]: null
      }
    }));
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#292D29] font-sans antialiased selection:bg-[#E6F0E5] selection:text-[#3B5240] relative">

      {/* --- SECTION A: STICKY NAVIGATION --- */}
      <nav className="sticky top-0 z-40 bg-[#FFF9F0]/95 backdrop-blur-md border-b border-[#EFE8DC] transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#66856A] to-[#456449] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#292D29]">RecipeBox</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#E89A55]" />
              </div>
              <p className="text-xs font-medium text-[#66856A] tracking-wider uppercase">Cook • Collect • Create</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 bg-[#FAF4EA] p-1.5 rounded-full border border-[#ECE2D2]">
            <button 
              onClick={() => scrollToSection('home')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeNav === 'home' ? 'bg-white text-[#292D29] shadow-sm' : 'text-[#616860] hover:text-[#292D29]'}`}
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('explore')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeNav === 'explore' ? 'bg-white text-[#292D29] shadow-sm' : 'text-[#616860] hover:text-[#292D29]'}`}
            >
              Explore Recipes
            </button>
            <button 
              onClick={() => scrollToSection('cooking-mode')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${activeNav === 'cooking-mode' ? 'bg-[#66856A] text-white shadow-sm' : 'text-[#616860] hover:text-[#292D29]'}`}
            >
              <Flame className="w-4 h-4 text-[#E89A55]" />
              Cooking Mode
            </button>
            <button 
              onClick={() => scrollToSection('favorites')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${activeNav === 'favorites' ? 'bg-white text-[#292D29] shadow-sm' : 'text-[#616860] hover:text-[#292D29]'}`}
            >
              <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              Favorites
              {favorites.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#E89A55] text-white text-xs flex items-center justify-center font-bold">
                  {favorites.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => scrollToSection('meal-planner')}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${activeNav === 'meal-planner' ? 'bg-white text-[#292D29] shadow-sm' : 'text-[#616860] hover:text-[#292D29]'}`}
            >
              <Calendar className="w-4 h-4" />
              Meal Planner
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick search button */}
            <div className="relative hidden sm:block">
              <input 
                type="text" 
                placeholder="Search pasta, soup..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeNav !== 'explore') scrollToSection('explore');
                }}
                className="w-44 focus:w-60 transition-all pl-9 pr-3 py-2 bg-white rounded-full text-xs border border-[#E5DACB] focus:outline-none focus:border-[#66856A] focus:ring-1 focus:ring-[#66856A]"
              />
              <Search className="w-4 h-4 text-[#8C948B] absolute left-3 top-2.5" />
            </div>

            {/* Sound Toggle */}
            <button 
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                showToast(soundEnabled ? 'Chime sound muted' : 'Sound effects enabled');
              }}
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
              className="w-10 h-10 rounded-full bg-white border border-[#E5DACB] flex items-center justify-center text-[#556054] hover:text-[#292D29] hover:border-[#66856A] transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#66856A]" /> : <VolumeX className="w-4 h-4 text-[#999999]" />}
            </button>

            {/* Culinary Cart Trigger */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative w-10 h-10 rounded-full bg-white border border-[#E5DACB] flex items-center justify-center text-[#556054] hover:text-[#292D29] hover:border-[#66856A] transition-colors"
              title="View Culinary Cart"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-4 h-4 text-[#66856A]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E89A55] text-white text-[11px] flex items-center justify-center font-bold shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile Menu */}
            <UserProfileMenu />

            {/* Mobile menu toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-full bg-white border border-[#E5DACB] flex items-center justify-center text-[#292D29]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFF9F0] border-b border-[#EFE8DC] px-4 pt-2 pb-6 space-y-2 animate-fadeIn">
            <div className="mb-3">
              <input 
                type="text" 
                placeholder="Search recipe or ingredients..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  scrollToSection('explore');
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm border border-[#E5DACB]"
              />
            </div>
            <button 
              onClick={() => scrollToSection('home')}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('explore')}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white flex items-center justify-between"
            >
              <span>Explore Recipes</span>
              <span className="text-xs text-[#66856A] font-semibold">{RECIPES_DATA.length} recipes</span>
            </button>
            <button 
              onClick={() => scrollToSection('cooking-mode')}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium bg-[#E6F0E5] text-[#2F4E34] flex items-center gap-2"
            >
              <Flame className="w-4 h-4 text-[#E89A55]" />
              Cooking Mode (Interactive)
            </button>
            <button 
              onClick={() => scrollToSection('favorites')}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                Favorites
              </span>
              <span className="text-xs bg-[#E89A55] text-white px-2 py-0.5 rounded-full font-bold">{favorites.length}</span>
            </button>

            <button 
              onClick={() => scrollToSection('meal-planner')}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-[#66856A]" />
              Weekly Meal Planner
            </button>

            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                setIsCartOpen(true);
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-900 flex items-center justify-between"
            >
              <span className="flex items-center gap-2 font-bold">
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                Culinary Cart
              </span>
              <span className="text-xs bg-[#E89A55] text-white px-2 py-0.5 rounded-full font-bold">
                {cartCount}
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* --- SECTION B: HERO SECTION --- */}
      <section id="home" className="relative pt-12 pb-20 overflow-hidden">
        {/* Subtle decorative vegetable stickers */}
        <div className="absolute top-10 left-[8%] animate-bounce opacity-70 hidden sm:block" style={{ animationDuration: '4s' }}>
          <TomatoIcon className="w-8 h-8" />
        </div>
        <div className="absolute top-28 right-[6%] animate-bounce opacity-75 hidden sm:block" style={{ animationDuration: '5s' }}>
          <CarrotIcon className="w-9 h-9" />
        </div>
        <div className="absolute bottom-12 left-[12%] animate-pulse opacity-60 hidden sm:block">
          <BasilLeafIcon className="w-7 h-7" />
        </div>
        <div className="absolute bottom-20 right-[15%] animate-pulse opacity-70 hidden sm:block">
          <MushroomIcon className="w-8 h-8" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F0E5] border border-[#CBDDD0] text-[#345339] text-xs font-semibold">
                <Leaf className="w-3.5 h-3.5 text-[#66856A]" />
                <span>Your friendly digital kitchen companion</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#292D29] tracking-tight leading-[1.15]">
                Your next favorite meal <br />
                <span className="text-[#66856A] relative inline-block">
                  starts here.
                  <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                    <path d="M1 5.5C50 2 150 2 199 5.5" stroke="#E89A55" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#555C54] max-w-xl leading-relaxed">
                Discover delicious recipes, organize your ingredients, and cook one simple step at a time with our signature interactive timeline.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button 
                  onClick={() => scrollToSection('explore')}
                  className="px-7 py-3.5 rounded-2xl bg-[#66856A] hover:bg-[#526F56] text-white font-medium text-sm sm:text-base flex items-center gap-2.5 shadow-md shadow-[#66856A]/20 transition-all hover:translate-y-[-2px]"
                >
                  <Utensils className="w-4 h-4" />
                  Explore Recipes
                </button>
                <button 
                  onClick={() => {
                    const sample = RECIPES_DATA.find(r => r.id === 'paneer-butter-masala') || RECIPES_DATA[0];
                    startCookingRecipe(sample);
                  }}
                  className="px-7 py-3.5 rounded-2xl bg-white hover:bg-[#FAF4EA] text-[#292D29] font-medium text-sm sm:text-base border border-[#E5DACB] flex items-center gap-2.5 shadow-sm transition-all hover:translate-y-[-2px]"
                >
                  <Flame className="w-4 h-4 text-[#E89A55]" />
                  Start Cooking
                </button>
              </div>

              {/* Quick stats badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#EFE8DC]/80 max-w-md">
                <div>
                  <p className="text-2xl font-bold font-serif text-[#292D29]">12+</p>
                  <p className="text-xs text-[#70786F]">Curated Recipes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-serif text-[#66856A]">100%</p>
                  <p className="text-xs text-[#70786F]">Step-by-Step</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-serif text-[#E89A55]">Free</p>
                  <p className="text-xs text-[#70786F]">No Sign-up Req.</p>
                </div>
              </div>
            </div>

            {/* Right Hero Section: Horizontally Scrolling & Animated Culinary Showcase */}
            <div 
              className="lg:col-span-6 space-y-4"
              onMouseEnter={() => setHeroPaused(true)}
              onMouseLeave={() => setHeroPaused(false)}
            >
              {(() => {
                const currentHero = featuredHeroRecipes[heroActiveIndex] || featuredHeroRecipes[0];
                return (
                  <div className="relative mx-auto max-w-lg lg:max-w-none">
                    {/* Decorative backdrop */}
                    <div className="absolute inset-0 bg-[#E6F0E5] rounded-3xl transform rotate-1 scale-[1.01]" />

                    {/* Featured Dish Spotlight Card */}
                    <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white aspect-[16/10] bg-[#FAF5EE]">
                      <img 
                        src={currentHero.image} 
                        alt={currentHero.name} 
                        className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Floating overlay badge inside photo */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                        <div className="max-w-[70%]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E89A55] text-[10px] font-bold uppercase tracking-wide">
                              Featured Dish
                            </span>
                            <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium">
                              {currentHero.cuisine}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-serif font-bold text-white truncate">{currentHero.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openRecipeDetails(currentHero)}
                            className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#292D29] text-xs font-bold backdrop-blur-sm transition-transform hover:scale-105"
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => startCookingRecipe(currentHero)}
                            className="px-3 py-1.5 rounded-xl bg-[#66856A] hover:bg-[#526F56] text-white text-xs font-bold shadow-sm transition-transform hover:scale-105 flex items-center gap-1"
                          >
                            <Flame className="w-3.5 h-3.5 text-[#E89A55]" />
                            Cook
                          </button>
                        </div>
                      </div>

                      {/* Floating pill: Ready in X mins */}
                      <div className="absolute top-3 left-3 bg-white/95 px-3 py-1.5 rounded-2xl shadow-md border border-[#EFE8DC] flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#66856A]" />
                        <span className="text-xs font-bold text-[#292D29]">{currentHero.prepTime + currentHero.cookTime} mins</span>
                      </div>

                      {/* Floating pill: Rating */}
                      <div className="absolute top-3 right-3 bg-white/95 px-3 py-1.5 rounded-2xl shadow-md border border-[#EFE8DC] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#E89A55]" />
                        <span className="text-xs font-bold text-[#292D29]">★ {currentHero.rating}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Horizontally scrolling culinary food cards strip */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#646F63] px-1">
                  <span>Explore Featured Recipes ({featuredHeroRecipes.length})</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setHeroActiveIndex(prev => (prev - 1 + featuredHeroRecipes.length) % featuredHeroRecipes.length)}
                      className="p-1 rounded-full bg-white hover:bg-[#FAF4EA] border border-[#E5DACB] text-[#556054]"
                      title="Previous featured dish"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setHeroActiveIndex(prev => (prev + 1) % featuredHeroRecipes.length)}
                      className="p-1 rounded-full bg-white hover:bg-[#FAF4EA] border border-[#E5DACB] text-[#556054]"
                      title="Next featured dish"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Horizontal scroll container */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 px-1">
                  {featuredHeroRecipes.map((item, idx) => {
                    const isSelected = idx === heroActiveIndex;
                    return (
                      <div 
                        key={item.id}
                        onClick={() => setHeroActiveIndex(idx)}
                        className={`flex-shrink-0 w-36 sm:w-40 rounded-2xl overflow-hidden border p-2 bg-white transition-all cursor-pointer ${
                          isSelected 
                            ? 'ring-2 ring-[#66856A] border-[#66856A] shadow-md scale-[1.02]' 
                            : 'border-[#EFE8DC] hover:border-[#66856A] opacity-85 hover:opacity-100'
                        }`}
                      >
                        <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-1.5 bg-[#FAF6F0]">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          <span className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${item.dietaryType === 'Vegetarian' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.dietaryType === 'Vegetarian' ? 'Veg' : 'Non-Veg'}
                          </span>
                        </div>
                        <p className="text-xs font-serif font-bold text-[#292D29] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#788577]">{item.cuisine} • {item.prepTime + item.cookTime}m</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION C: EXPLORE RECIPES & FILTERS --- */}
      <section id="explore" className="py-16 bg-[#FFFDFC] border-y border-[#EFE8DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] text-[#66856A] text-xs font-bold uppercase tracking-wider mb-2">
              <Utensils className="w-3.5 h-3.5" />
              Discover Recipes
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#292D29]">Explore Our Digital Cookbook</h2>
            <p className="text-[#646C62] text-sm sm:text-base mt-2">
              Filter by cuisine, prep time, or dietary preference to discover delicious homemade dishes.
            </p>
          </div>

          {/* Search & Filter Bar Controls */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#ECE2D2] mb-10 space-y-4">
            
            {/* Top row: Search input + Sort By */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 relative">
                <input 
                  type="text" 
                  placeholder="Search recipes by title or ingredient (e.g. paneer, tomatoes, pasta)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCD] text-sm focus:outline-none focus:border-[#66856A] focus:bg-white transition-all"
                />
                <Search className="w-5 h-5 text-[#8A9689] absolute left-3.5 top-3.5" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3.5 text-[#8A9689] hover:text-[#292D29]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="md:col-span-4 flex items-center gap-2">
                <span className="text-xs text-[#737C72] font-medium whitespace-nowrap">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-3 px-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCD] text-xs font-medium focus:outline-none focus:border-[#66856A]"
                >
                  <option value="popularity">Most Popular (Rating)</option>
                  <option value="time-asc">Cooking Time (Fastest First)</option>
                  <option value="time-desc">Cooking Time (Longest First)</option>
                  <option value="name-asc">Alphabetical (A - Z)</option>
                </select>
              </div>
            </div>

            {/* Filter Pills Tabs */}
            <div className="pt-2 border-t border-[#F2ECE1] space-y-3">
              
              {/* Cuisine Filter */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-[#50594F] mr-1">Cuisine:</span>
                {['All', 'Italian', 'Indian', 'Asian', 'Continental', 'American'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCuisine(c)}
                    className={`px-3 py-1.5 rounded-full font-medium transition-all ${selectedCuisine === c ? 'bg-[#66856A] text-white shadow-sm' : 'bg-[#FAF6F0] text-[#556054] hover:bg-[#EFE8DC]'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Secondary Filters row: Dietary, Prep Time, Difficulty */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                
                {/* Dietary */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#50594F]">Diet:</span>
                  {['All', 'Vegetarian', 'Non-Vegetarian'].map(d => (
                    <button
                      key={d}
                      onClick={() => setSelectedDietary(d)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${selectedDietary === d ? 'bg-[#E89A55] text-white font-bold' : 'bg-[#FAF6F0] text-[#556054] hover:bg-[#EFE8DC]'}`}
                    >
                      {d === 'Vegetarian' ? '🌱 Veg' : d === 'Non-Vegetarian' ? '🍗 Non-Veg' : 'All'}
                    </button>
                  ))}
                </div>

                {/* Prep Time */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#50594F]">Time:</span>
                  <select 
                    value={selectedPrepTime}
                    onChange={(e) => setSelectedPrepTime(e.target.value)}
                    className="py-1 px-2.5 rounded-full bg-[#FAF6F0] border border-[#E8DDCD] text-xs font-medium"
                  >
                    <option value="All">Any Duration</option>
                    <option value="under-15">&lt; 15 mins</option>
                    <option value="15-30">15 – 30 mins</option>
                    <option value="30-60">30 – 60 mins</option>
                    <option value="over-60">&gt; 60 mins</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#50594F]">Difficulty:</span>
                  <select 
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="py-1 px-2.5 rounded-full bg-[#FAF6F0] border border-[#E8DDCD] text-xs font-medium"
                  >
                    <option value="All">All Levels</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(selectedCuisine !== 'All' || selectedDietary !== 'All' || selectedPrepTime !== 'All' || selectedDifficulty !== 'All' || searchQuery !== '') && (
                  <button 
                    onClick={clearFilters}
                    className="ml-auto text-xs text-[#E05345] font-semibold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#616B60]">
              Showing <span className="font-bold text-[#292D29]">{filteredRecipes.length}</span> recipes
            </p>
            {filteredRecipes.length < RECIPES_DATA.length && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#E6F0E5] text-[#3B5A3E] font-medium">
                Filtered from {RECIPES_DATA.length} total
              </span>
            )}
          </div>

          {/* Recipes Cards Grid */}
          {filteredRecipes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#ECE2D2] max-w-md mx-auto my-8">
              <CarrotIcon className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-serif font-bold text-[#292D29]">No Recipes Found</h3>
              <p className="text-sm text-[#6C756B] mt-1 mb-5">
                We couldn't find any recipes matching your current search or filter combination.
              </p>
              <button 
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-2xl bg-[#66856A] text-white text-xs font-semibold hover:bg-[#526F56] transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecipes.map((recipe) => {
                const isFav = favorites.includes(recipe.id);
                const totalMinutes = recipe.prepTime + recipe.cookTime;
                const isPremium = PREMIUM_RECIPE_IDS.has(recipe.id);
                const isPurchased = purchasedRecipeIds.has(recipe.id);
                const isUnlocked = !isPremium || isPurchased;

                return (
                  <div 
                    key={recipe.id}
                    onClick={() => openRecipeDetails(recipe)}
                    className="group bg-white rounded-3xl overflow-hidden border border-[#EFE8DC] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer hover:translate-y-[-4px]"
                  >
                    {/* Card Image Box */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#FAF6F0]">
                      <img 
                        src={recipe.image} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* Dietary Type & Pricing Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                        {isPremium ? (
                          isPurchased ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white shadow-sm flex items-center gap-1">
                              <Check className="w-3 h-3" /> Unlocked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Premium • ₹9
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                            FREE
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-sm ${recipe.dietaryType === 'Vegetarian' ? 'bg-white/95 text-[#2E6B38] border border-green-200' : 'bg-white/95 text-[#9E342B] border border-red-200'}`}>
                          {recipe.dietaryType === 'Vegetarian' ? '🌱 Veg' : '🍗 Non-Veg'}
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <button 
                        onClick={(e) => toggleFavorite(recipe.id, e)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-transform active:scale-90"
                        title={isFav ? "Remove favorite" : "Add to favorites"}
                      >
                        <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-[#7A8578] hover:text-red-500'}`} />
                      </button>

                      {/* Difficulty chip */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-[#292D29] shadow-sm">
                          {recipe.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#707B6F] mb-1">
                          <span className="font-medium text-[#66856A] uppercase tracking-wider text-[10px]">
                            {recipe.category}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-[#292D29]">
                            ★ {recipe.rating}
                          </span>
                        </div>

                        <h3 className="text-base font-serif font-bold text-[#292D29] group-hover:text-[#66856A] transition-colors line-clamp-1">
                          {recipe.name}
                        </h3>

                        <p className="text-xs text-[#636C61] line-clamp-2 mt-1 leading-relaxed">
                          {recipe.description}
                        </p>
                      </div>

                      {/* Card Footer Info */}
                      <div className="pt-3 border-t border-[#F2ECE1] flex items-center justify-between text-xs text-[#6B756A]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#889487]" />
                          <span>{totalMinutes} mins</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isUnlocked ? (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBuyNow(recipe);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                                title="Buy Now for ₹9"
                              >
                                <span>Buy ₹9</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const res = addToCart(recipe);
                                  showToast(res.message, res.success ? 'success' : 'info');
                                }}
                                className="p-1.5 rounded-xl bg-[#FAF4EA] hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-[#E5DACB] transition-colors"
                                title="Add to culinary cart"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                startCookingRecipe(recipe);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-[#E6F0E5] hover:bg-[#66856A] text-[#2F4E34] hover:text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                            >
                              <Flame className="w-3 h-3 text-[#E89A55]" />
                              Cook
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* --- SECTION D & E: SIGNATURE COOKING MODE --- */}
      <section id="cooking-mode" className="py-20 bg-[#FAF7F0] border-b border-[#ECE2D2] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Recipe Switcher */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F0E5] text-[#2F4E34] text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 text-[#E89A55]" />
                Signature Interactive Feature
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#292D29]">
                Step-by-Step Cooking Mode
              </h2>
              <p className="text-[#646E63] text-sm mt-1 max-w-xl">
                Follow our gentle snake timeline checkpoint by checkpoint. Mark each step complete as you cook delicious homemade food.
              </p>
            </div>

            {/* Recipe Switcher Dropdown */}
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-[#E5DACB] shadow-sm">
              <span className="text-xs text-[#6F786E] font-medium whitespace-nowrap">Cooking:</span>
              <select 
                value={cookingRecipeId}
                onChange={(e) => setCookingRecipeId(e.target.value)}
                className="text-xs font-bold text-[#292D29] bg-transparent focus:outline-none cursor-pointer"
              >
                {RECIPES_DATA.map(r => {
                  const isPrem = PREMIUM_RECIPE_IDS.has(r.id);
                  const isOwned = purchasedRecipeIds.has(r.id);
                  const badge = isPrem ? (isOwned ? '✓ Unlocked' : '★ Premium (₹9)') : '• Free';
                  return (
                    <option key={r.id} value={r.id}>
                      {r.name} — {badge}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* TWO-COLUMN INTERACTIVE COOKING INTERFACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: RECIPE OVERVIEW & PROGRESS CARD */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              
              {/* Main Recipe Info Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#EBE2D3] shadow-md space-y-5">
                
                {/* Photo with Overlay Badge */}
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#FAF6F0]">
                  <img 
                    src={currentCookingRecipe.image} 
                    alt={currentCookingRecipe.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${currentCookingRecipe.dietaryType === 'Vegetarian' ? 'bg-white text-green-700' : 'bg-white text-red-700'}`}>
                      {currentCookingRecipe.dietaryType === 'Vegetarian' ? '🌱 Veg' : '🍗 Non-Veg'}
                    </span>
                  </div>
                </div>

                {/* Title & Specs */}
                <div>
                  <div className="flex items-center justify-between text-xs text-[#7B8679] mb-1">
                    <span>{currentCookingRecipe.cuisine} • {currentCookingRecipe.category}</span>
                    <span className="font-semibold text-[#292D29]">★ {currentCookingRecipe.rating}</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#292D29]">
                    {currentCookingRecipe.name}
                  </h3>
                  <p className="text-xs text-[#636C61] mt-1 leading-relaxed">
                    {currentCookingRecipe.tagline}
                  </p>
                </div>

                {/* Quick details chips */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#F0E8DC] text-center text-xs">
                  <div className="bg-[#FAF7F2] p-2 rounded-xl">
                    <p className="text-[#869284] text-[10px]">Prep Time</p>
                    <p className="font-bold text-[#292D29]">{currentCookingRecipe.prepTime}m</p>
                  </div>
                  <div className="bg-[#FAF7F2] p-2 rounded-xl">
                    <p className="text-[#869284] text-[10px]">Cook Time</p>
                    <p className="font-bold text-[#292D29]">{currentCookingRecipe.cookTime}m</p>
                  </div>
                  <div className="bg-[#FAF7F2] p-2 rounded-xl">
                    <p className="text-[#869284] text-[10px]">Servings</p>
                    <p className="font-bold text-[#292D29]">{currentCookingRecipe.servings}</p>
                  </div>
                </div>

                {/* Total Progress Gauge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#292D29]">
                      Progress: {currentRecipeProgress.completedSteps.length} of {currentCookingRecipe.steps.length} steps
                    </span>
                    <span className="text-[#4D9662]">
                      {Math.round((currentRecipeProgress.completedSteps.length / currentCookingRecipe.steps.length) * 100)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-[#EAE2D5] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#66856A] to-[#4D9662] transition-all duration-500 rounded-full"
                      style={{ 
                        width: `${(currentRecipeProgress.completedSteps.length / currentCookingRecipe.steps.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Chef's Tip Card */}
                {currentCookingRecipe.chefTip && (
                  <div className="bg-[#FAF4EA] p-4 rounded-2xl border border-[#E9DECD] flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#E89A55]/20 text-[#E89A55] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#8A5B2E] uppercase tracking-wide">Chef's Secret Tip</p>
                      <p className="text-xs text-[#524B43] mt-0.5 leading-relaxed">
                        {currentCookingRecipe.chefTip}
                      </p>
                    </div>
                  </div>
                )}



              </div>
            </div>

            {/* RIGHT COLUMN: THE SNAKE-LIKE PROGRESS TIMELINE */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE2D3] shadow-md relative">
              {(() => {
                const isCurrentCookingRecipeUnlocked = !PREMIUM_RECIPE_IDS.has(currentCookingRecipe.id) || purchasedRecipeIds.has(currentCookingRecipe.id);
                if (!isCurrentCookingRecipeUnlocked) {
                  return (
                    <div className="py-12 px-6 text-center bg-gradient-to-br from-amber-50/90 to-orange-50/90 border-2 border-dashed border-amber-300 rounded-3xl space-y-5 my-4">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                          Exclusive Premium Recipe • ₹9
                        </span>
                        <h3 className="text-2xl font-serif font-bold text-slate-800 mt-3">
                          Unlock Cooking Path & Voice Assistant
                        </h3>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                          {currentCookingRecipe.name} is a curated premium chef creation. Unlock all {currentCookingRecipe.steps.length} interactive checkpoints, step timers, and multilingual voice assistance for just ₹9.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-wrap justify-center gap-3">
                        <button
                          onClick={() => handleBuyNow(currentCookingRecipe)}
                          className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Unlock Now for ₹9</span>
                        </button>
                        <button
                          onClick={() => {
                            const res = addToCart(currentCookingRecipe);
                            showToast(res.message, res.success ? 'success' : 'info');
                          }}
                          className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#F0E8DC]">
                      <h3 className="text-xl font-serif font-bold text-[#292D29]">
                        Cooking Path ({currentCookingRecipe.steps.length} Steps)
                      </h3>
                      <button 
                        onClick={handleResetCooking}
                        className="text-xs text-[#8A9589] hover:text-[#E05345] font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Progress
                      </button>
                    </div>

              {/* CELEBRATORY BANNER IF 100% COMPLETE */}
              {currentRecipeProgress.completedSteps.length === currentCookingRecipe.steps.length && (
                <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-[#E6F0E5] to-[#D5EBD3] border-2 border-[#4D9662] text-center space-y-3 animate-fadeIn">
                  <div className="w-14 h-14 rounded-full bg-[#4D9662] text-white mx-auto flex items-center justify-center shadow-md animate-bounce">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h4 className="text-2xl font-serif font-bold text-[#214227]">
                    🎉 Recipe Completed! Bon Appétit!
                  </h4>
                  <p className="text-xs sm:text-sm text-[#3E5C43] max-w-md mx-auto">
                    You've successfully prepared {currentCookingRecipe.name}. Take pride in your homemade culinary masterpiece!
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button 
                      onClick={handleResetCooking}
                      className="px-4 py-2 rounded-xl bg-white text-[#292D29] text-xs font-bold border border-[#CBDDD0] shadow-sm hover:bg-[#FAF6F0]"
                    >
                      Cook Again
                    </button>
                    <button 
                      onClick={() => scrollToSection('explore')}
                      className="px-4 py-2 rounded-xl bg-[#66856A] text-white text-xs font-bold shadow-sm hover:bg-[#526F56]"
                    >
                      Browse Next Recipe
                    </button>
                  </div>
                </div>
              )}

              {/* VOICE ASSISTANT CONTROL CENTER */}
              <div className="mb-8">
                <VoiceCookingAssistant 
                  voiceState={voiceAssistant}
                  currentStepNumber={currentRecipeProgress.activeStep || 1}
                  totalSteps={currentCookingRecipe.steps.length}
                  recipeName={currentCookingRecipe.name}
                />
              </div>

              {/* THE SNAKE TIMELINE CONTAINER */}
              <div className="relative" ref={timelineContainerRef}>
                
                {/* SVG SNAKE CURVED CONNECTOR PATH (Dynamic Center-Aligned) */}
                <div className="absolute top-0 bottom-0 left-0 w-28 pointer-events-none hidden sm:block overflow-visible">
                  <svg className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4D9662" />
                        <stop offset="100%" stopColor="#66856A" />
                      </linearGradient>
                    </defs>

                    {/* Build Dynamic Center-Aligned Bezier Curves */}
                    {stepNodeCoords.length > 1 ? (
                      stepNodeCoords.map((coord, idx) => {
                        if (idx === stepNodeCoords.length - 1) return null;
                        const nextCoord = stepNodeCoords[idx + 1];
                        if (!nextCoord) return null;

                        const isSegmentCompleted = currentRecipeProgress.completedSteps.includes(coord.id);
                        const midY = (coord.y + nextCoord.y) / 2;
                        const pathD = `M ${coord.x} ${coord.y} C ${coord.x} ${midY}, ${nextCoord.x} ${midY}, ${nextCoord.x} ${nextCoord.y}`;

                        return (
                          <g key={`snake-seg-${idx}`}>
                            <path 
                              d={pathD} 
                              stroke="#E3EDE2" 
                              strokeWidth="4" 
                              fill="none" 
                              strokeLinecap="round"
                            />
                            {isSegmentCompleted && (
                              <path 
                                d={pathD} 
                                stroke="#4D9662" 
                                strokeWidth="5" 
                                fill="none" 
                                strokeLinecap="round"
                                className="transition-all duration-700"
                              />
                            )}
                          </g>
                        );
                      })
                    ) : (
                      currentCookingRecipe.steps.map((step, idx) => {
                        if (idx === currentCookingRecipe.steps.length - 1) return null;
                        const stepHeight = 165;
                        const startY = idx * stepHeight + 40;
                        const endY = (idx + 1) * stepHeight + 40;
                        const startX = idx % 2 === 0 ? 32 : 64;
                        const endX = (idx + 1) % 2 === 0 ? 32 : 64;
                        const pathD = `M ${startX} ${startY} C ${startX} ${startY + 60}, ${endX} ${endY - 60}, ${endX} ${endY}`;
                        const isSegmentCompleted = currentRecipeProgress.completedSteps.includes(step.id);

                        return (
                          <g key={`snake-seg-fb-${idx}`}>
                            <path d={pathD} stroke="#E3EDE2" strokeWidth="4" fill="none" strokeLinecap="round" />
                            {isSegmentCompleted && (
                              <path d={pathD} stroke="#4D9662" strokeWidth="5" fill="none" strokeLinecap="round" />
                            )}
                          </g>
                        );
                      })
                    )}
                  </svg>
                </div>

                {/* STEP CARDS LIST */}
                <div className="space-y-8 sm:pl-24">
                  {currentCookingRecipe.steps.map((step, idx) => {
                    const isCompleted = currentRecipeProgress.completedSteps.includes(step.id);
                    const isActive = currentRecipeProgress.activeStep === step.id && !isCompleted;
                    const timer = stepTimers[step.id];

                    // Oscillate checkpoint position for snake appearance
                    const checkpointLeftClass = idx % 2 === 0 ? 'sm:-left-[5rem]' : 'sm:-left-[3rem]';

                    return (
                      <div 
                        key={step.id} 
                        id={`cooking-step-${step.id}`}
                        className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-300 border ${
                          isCompleted 
                            ? 'bg-[#F7FAF7] border-[#CFE5CE] opacity-90' 
                            : isActive 
                              ? 'bg-white border-2 border-[#66856A] shadow-lg ring-4 ring-[#66856A]/10 scale-[1.01]' 
                              : 'bg-white/80 border-[#EFE8DC]'
                        }`}
                      >
                        {/* Checkpoint Node (Circle) */}
                        <div 
                          id={`step-node-${step.id}`}
                          onClick={() => toggleStepCompleted(step.id)}
                          className={`absolute -top-3.5 left-4 sm:top-5 ${checkpointLeftClass} z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all duration-300 shadow-md ${
                            isCompleted 
                              ? 'bg-[#4D9662] text-white scale-105' 
                              : isActive 
                                ? 'bg-white border-4 border-[#66856A] text-[#292D29] scale-110 ring-4 ring-[#66856A]/20' 
                                : 'bg-[#FAF6F0] border-2 border-[#CBDDD0] text-[#788577]'
                          }`}
                          title={isCompleted ? "Click to uncheck" : "Click to complete step"}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : (
                            <span>{step.id}</span>
                          )}
                        </div>

                        {/* Step Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isCompleted 
                                ? 'bg-[#E6F0E5] text-[#2F4E34]' 
                                : isActive 
                                  ? 'bg-[#66856A] text-white' 
                                  : 'bg-[#FAF6F0] text-[#707B6F]'
                            }`}>
                              Step {step.id} of {currentCookingRecipe.steps.length}
                            </span>
                            {isCompleted && (
                              <span className="text-xs font-semibold text-[#4D9662] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                              </span>
                            )}
                          </div>

                          {/* Duration Badge */}
                          {step.duration && (
                            <span className="text-xs font-medium text-[#646F63] flex items-center gap-1 bg-[#FAF6F0] px-2.5 py-1 rounded-xl">
                              <Clock className="w-3.5 h-3.5 text-[#889487]" />
                              {step.duration} mins
                            </span>
                          )}
                        </div>

                        {/* Step Title & Instruction */}
                        <h4 className="text-lg font-serif font-bold text-[#292D29] mb-1.5">
                          {step.title}
                        </h4>
                        <p className="text-sm text-[#4E564D] leading-relaxed mb-4">
                          {step.instruction}
                        </p>

                        {/* Step Interactive Timer Box (if duration configured) */}
                        {step.duration && (
                          <div className="mb-4 p-3 bg-[#FAF7F2] rounded-2xl border border-[#EDE3D4] flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-white border border-[#E5DACB] flex items-center justify-center text-[#E89A55]">
                                <Clock className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-[#808A7E] uppercase tracking-wider">Step Timer</p>
                                <p className="text-sm font-bold font-mono text-[#292D29]">
                                  {timer 
                                    ? `${Math.floor(timer.timeLeft / 60)}:${(timer.timeLeft % 60).toString().padStart(2, '0')}` 
                                    : `${step.duration}:00`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {(!timer || !timer.isRunning) ? (
                                <button 
                                  onClick={() => {
                                    const initialSeconds = timer ? timer.timeLeft : step.duration * 60;
                                    setStepTimers(prev => ({
                                      ...prev,
                                      [step.id]: {
                                        timeLeft: initialSeconds,
                                        initial: step.duration * 60,
                                        isRunning: true
                                      }
                                    }));
                                    showToast(`Timer started for Step ${step.id}!`);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4EA] text-[#292D29] text-xs font-semibold border border-[#E5DACB] flex items-center gap-1 shadow-sm"
                                >
                                  <Play className="w-3 h-3 fill-current text-[#4D9662]" />
                                  {timer && timer.timeLeft < step.duration * 60 ? 'Resume' : 'Start Timer'}
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setStepTimers(prev => ({
                                      ...prev,
                                      [step.id]: { ...prev[step.id], isRunning: false }
                                    }));
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4EA] text-[#292D29] text-xs font-semibold border border-[#E5DACB] flex items-center gap-1 shadow-sm"
                                >
                                  <Pause className="w-3 h-3 fill-current text-[#E89A55]" />
                                  Pause
                                </button>
                              )}

                              {timer && (
                                <button 
                                  onClick={() => {
                                    setStepTimers(prev => ({
                                      ...prev,
                                      [step.id]: {
                                        timeLeft: step.duration * 60,
                                        initial: step.duration * 60,
                                        isRunning: false
                                      }
                                    }));
                                  }}
                                  title="Reset timer"
                                  className="p-1.5 rounded-xl text-[#7E887C] hover:text-[#292D29]"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Step Action Button */}
                        <div className="flex items-center justify-between pt-2">
                          <button 
                            onClick={() => {
                              if (isCompleted) {
                                toggleStepCompleted(step.id);
                              } else {
                                markStepComplete(step.id);
                              }
                            }}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                              isCompleted 
                                ? 'bg-white text-[#4D9662] border border-[#CBDDD0] hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                                : isActive 
                                  ? 'bg-[#66856A] hover:bg-[#526F56] text-white shadow-md shadow-[#66856A]/20 scale-100 hover:scale-105' 
                                  : 'bg-[#FAF6F0] hover:bg-[#EFE8DC] text-[#4F594D]'
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Completed (Click to Revisit)</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Complete Step</span>
                              </>
                            )}
                          </button>

                          {/* Step Navigation Controls */}
                          <div className="flex items-center gap-2">
                            {idx > 0 && (
                              <button 
                                onClick={() => {
                                  const prevStep = currentCookingRecipe.steps[idx - 1];
                                  setAllCookingProgress(prev => ({
                                    ...prev,
                                    [cookingRecipeId]: {
                                      ...(prev[cookingRecipeId] || {}),
                                      activeStep: prevStep.id
                                    }
                                  }));
                                  const prevStepEl = document.getElementById(`cooking-step-${prevStep.id}`);
                                  if (prevStepEl) prevStepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                                className="px-3 py-1.5 rounded-xl border border-[#E5DACB] bg-white hover:bg-[#FAF4EA] text-xs text-[#525B50] hover:text-[#292D29] flex items-center gap-1 font-medium transition-colors"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Previous</span>
                              </button>
                            )}
                            {idx < currentCookingRecipe.steps.length - 1 && (
                              <button 
                                onClick={() => {
                                  const nextStep = currentCookingRecipe.steps[idx + 1];
                                  setAllCookingProgress(prev => ({
                                    ...prev,
                                    [cookingRecipeId]: {
                                      ...(prev[cookingRecipeId] || {}),
                                      activeStep: nextStep.id
                                    }
                                  }));
                                  const nextStepEl = document.getElementById(`cooking-step-${nextStep.id}`);
                                  if (nextStepEl) nextStepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                                className="px-3 py-1.5 rounded-xl border border-[#E5DACB] bg-white hover:bg-[#FAF4EA] text-xs text-[#525B50] hover:text-[#292D29] flex items-center gap-1 font-medium transition-colors"
                              >
                                <span>Next</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            </>
          );
        })()}

            </div>

          </div>

        </div>
      </section>

      {/* --- SECTION F: FAVORITES SECTION --- */}
      <section id="favorites" className="py-16 bg-[#FFFDFC] border-b border-[#EFE8DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE8] text-[#D8493D] text-xs font-bold uppercase tracking-wider mb-2">
                <Heart className="w-3.5 h-3.5 fill-current" />
                Personal Cookbook
              </div>
              <h2 className="text-3xl font-serif font-bold text-[#292D29]">Your Saved Favorites</h2>
              <p className="text-xs sm:text-sm text-[#666F64] mt-1">
                Access your cherished recipes instantly anytime.
              </p>
            </div>

            <div className="text-xs font-semibold px-3 py-1.5 rounded-2xl bg-[#FAF4EA] text-[#66856A] border border-[#EAE0D1]">
              {favorites.length} Saved {favorites.length === 1 ? 'Recipe' : 'Recipes'}
            </div>
          </div>

          {favoriteRecipes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#ECE2D2] max-w-md mx-auto my-6">
              <Heart className="w-12 h-12 text-[#E5DACB] mx-auto mb-3" />
              <h3 className="text-lg font-serif font-bold text-[#292D29]">No Favorites Saved Yet</h3>
              <p className="text-xs text-[#6F776C] mt-1 mb-4">
                Click the heart icon on any recipe to save it here for quick cooking anytime.
              </p>
              <button 
                onClick={() => scrollToSection('explore')}
                className="px-5 py-2.5 rounded-2xl bg-[#66856A] text-white text-xs font-semibold hover:bg-[#526F56] transition-colors"
              >
                Browse Recipes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteRecipes.map(recipe => (
                <div 
                  key={recipe.id}
                  onClick={() => openRecipeDetails(recipe)}
                  className="bg-white rounded-3xl overflow-hidden border border-[#EFE8DC] shadow-sm hover:shadow-lg transition-all flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[16/10] bg-[#FAF6F0]">
                    <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => toggleFavorite(recipe.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-red-500"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#7B8679] mb-1">
                        <span>{recipe.cuisine}</span>
                        <span className="font-bold text-[#292D29]">★ {recipe.rating}</span>
                      </div>
                      <h4 className="text-base font-serif font-bold text-[#292D29]">{recipe.name}</h4>
                      <p className="text-xs text-[#626A5F] line-clamp-2 mt-1">{recipe.description}</p>
                    </div>

                    <div className="pt-3 border-t border-[#F2ECE1] flex items-center justify-between">
                      <span className="text-xs text-[#6D776B] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {recipe.prepTime + recipe.cookTime} mins
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startCookingRecipe(recipe);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#66856A] text-white text-xs font-bold hover:bg-[#526F56] flex items-center gap-1"
                      >
                        <Flame className="w-3 h-3 text-[#E89A55]" />
                        Cook
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>



      {/* --- SECTION H: WEEKLY MEAL PLANNER --- */}
      <section id="meal-planner" className="py-16 bg-[#FFFDFC] border-b border-[#ECE2D2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF4EA] text-[#A66C32] text-xs font-bold uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5 text-[#E89A55]" />
                Weekly Routine
              </div>
              <h2 className="text-3xl font-serif font-bold text-[#292D29]">Weekly Meal Planner</h2>
              <p className="text-xs sm:text-sm text-[#666F64] mt-1">
                Assign meals for Breakfast, Lunch, and Dinner across all 7 days.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#4D9662] bg-[#E6F0E5] px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Auto-saved locally
              </span>
              <button 
                onClick={clearWeekMealPlan}
                className="px-3.5 py-1.5 rounded-2xl bg-white border border-[#E5DACB] text-xs font-semibold text-[#6E786B] hover:text-red-600 hover:border-red-200"
              >
                Clear Week
              </button>
            </div>
          </div>

          {/* Day of Week Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
              const fullNames = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
              const isSelected = activeDay === day;
              const dayMeals = mealPlan[day] || {};
              const count = [dayMeals.breakfast, dayMeals.lunch, dayMeals.dinner].filter(Boolean).length;

              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2.5 rounded-2xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected 
                      ? 'bg-[#66856A] text-white shadow-md' 
                      : 'bg-white text-[#505A4E] border border-[#E8DDCD] hover:bg-[#FAF4EA]'
                  }`}
                >
                  <span className="font-bold">{fullNames[day]}</span>
                  {count > 0 && (
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${isSelected ? 'bg-white text-[#66856A]' : 'bg-[#E6F0E5] text-[#2F4E34]'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Meals for Selected Day */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Breakfast Slot */}
            {['breakfast', 'lunch', 'dinner'].map((mealSlot) => {
              const slotLabels = {
                breakfast: { label: 'Breakfast', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
                lunch: { label: 'Lunch', icon: Utensils, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                dinner: { label: 'Dinner', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' }
              };
              const { label, icon: MealIcon, color, bg } = slotLabels[mealSlot];
              const recipeId = mealPlan[activeDay]?.[mealSlot];
              const recipe = RECIPES_DATA.find(r => r.id === recipeId);

              return (
                <div 
                  key={mealSlot}
                  className="bg-white rounded-3xl p-5 border border-[#EFE8DC] shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl ${bg} ${color} flex items-center justify-center`}>
                        <MealIcon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-[#292D29]">{label}</h4>
                    </div>

                    {recipe && (
                      <button 
                        onClick={() => removeMealFromPlan(activeDay, mealSlot)}
                        className="text-[#9FA99D] hover:text-red-500 text-xs"
                        title="Remove meal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {recipe ? (
                    <div className="bg-[#FAF7F2] rounded-2xl p-3 border border-[#EFE5D5] flex items-center gap-3">
                      <img 
                        src={recipe.image} 
                        alt={recipe.name} 
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-serif font-bold text-[#292D29] truncate">{recipe.name}</h5>
                        <p className="text-[10px] text-[#788275] mt-0.5">{recipe.cuisine} • {recipe.prepTime + recipe.cookTime}m</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button 
                            onClick={() => startCookingRecipe(recipe)}
                            className="text-[10px] font-bold text-[#66856A] hover:underline flex items-center gap-0.5"
                          >
                            <Flame className="w-3 h-3 text-[#E89A55]" />
                            Cook Now
                          </button>
                          <span className="text-gray-300">•</span>
                          <button 
                            onClick={() => setMealModalSlot({ day: activeDay, meal: mealSlot })}
                            className="text-[10px] font-semibold text-[#8C968A] hover:underline"
                          >
                            Swap
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setMealModalSlot({ day: activeDay, meal: mealSlot })}
                      className="py-8 border-2 border-dashed border-[#E5DACB] rounded-2xl text-center hover:border-[#66856A] hover:bg-[#FAF7F2] transition-colors flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#FAF4EA] group-hover:bg-[#E6F0E5] text-[#8A9588] group-hover:text-[#66856A] flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#768074]">Assign a Recipe</span>
                    </button>
                  )}

                  <div className="text-[11px] text-[#8C968A] text-right">
                    {activeDay} {label}
                  </div>
                </div>
              );
            })}

          </div>

        </div>
      </section>

      {/* --- SECTION I: FOOTER --- */}
      <footer className="bg-[#FAF4EA] border-t border-[#EFE8DC] pt-14 pb-12 text-[#5E685C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-between">
            
            {/* Brand column */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#66856A] flex items-center justify-center text-white">
                  <ChefHat className="w-5 h-5" />
                </div>
                <span className="font-serif text-2xl font-bold text-[#292D29]">RecipeBox</span>
              </div>
              <p className="text-xs text-[#707A6D] max-w-sm leading-relaxed">
                Simple, warm, and interactive recipe organizer crafted for students, beginners, and everyday home cooks.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <TomatoIcon className="w-6 h-6" />
                <CarrotIcon className="w-6 h-6" />
                <BasilLeafIcon className="w-6 h-6" />
                <MushroomIcon className="w-6 h-6" />
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-2">
              <h4 className="text-xs font-bold text-[#292D29] uppercase tracking-wider">Quick Navigation</h4>
              <ul className="space-y-1.5 text-xs">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-[#292D29]">Home</button></li>
                <li><button onClick={() => scrollToSection('explore')} className="hover:text-[#292D29]">Explore Recipes</button></li>
                <li><button onClick={() => scrollToSection('cooking-mode')} className="hover:text-[#292D29]">Cooking Mode</button></li>
                <li><button onClick={() => scrollToSection('favorites')} className="hover:text-[#292D29]">Favorites</button></li>
                <li><button onClick={() => scrollToSection('meal-planner')} className="hover:text-[#292D29]">Meal Planner</button></li>
              </ul>
            </div>

            {/* Inspiration Quote */}
            <div className="md:col-span-4 bg-white/80 p-5 rounded-2xl border border-[#E9DFD0] space-y-2">
              <p className="text-xs font-bold text-[#66856A] uppercase tracking-wide">Cooking Philosophy</p>
              <p className="text-base font-serif italic text-[#292D29]">
                “Good food brings people together.”
              </p>
              <p className="text-[11px] text-[#7A8477]">
                Every great recipe starts with patience, love, and one simple step at a time.
              </p>
            </div>

          </div>

          <div className="pt-6 border-t border-[#E9DFD0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A9488]">
            <p>© {new Date().getFullYear()} RecipeBox — Simple, Interactive Recipe Organizer.</p>
            <p className="mt-2 sm:mt-0 flex items-center gap-1">
              Cook with joy & care 🌿
            </p>
          </div>

        </div>
      </footer>

      {/* --- RECIPE DETAILS MODAL --- */}
      {detailRecipe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#EBE2D3] shadow-2xl relative my-8">
            
            {/* Close button */}
            <button 
              onClick={() => setDetailRecipe(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-[#292D29] transition-transform active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Image Header */}
            <div className="relative aspect-[16/9] w-full bg-[#FAF6F0]">
              <img 
                src={detailRecipe.image} 
                alt={detailRecipe.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${detailRecipe.dietaryType === 'Vegetarian' ? 'bg-white text-green-700' : 'bg-white text-red-700'}`}>
                    {detailRecipe.dietaryType === 'Vegetarian' ? '🌱 Vegetarian' : '🍗 Non-Vegetarian'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/30 backdrop-blur-sm">
                    {detailRecipe.cuisine}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold">{detailRecipe.name}</h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Specs & Serving Adjustment */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF6F0] border border-[#EFE5D5]">
                <div className="flex items-center gap-4 text-xs text-[#525B50]">
                  <div>
                    <span className="block text-[#828D80] text-[10px]">Total Time</span>
                    <span className="font-bold text-sm text-[#292D29]">{detailRecipe.prepTime + detailRecipe.cookTime} mins</span>
                  </div>
                  <div>
                    <span className="block text-[#828D80] text-[10px]">Difficulty</span>
                    <span className="font-bold text-sm text-[#292D29]">{detailRecipe.difficulty}</span>
                  </div>
                  <div>
                    <span className="block text-[#828D80] text-[10px]">Calories</span>
                    <span className="font-bold text-sm text-[#292D29]">{detailRecipe.calories} kcal</span>
                  </div>
                </div>

                {/* Serving Scaler */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#50594E]">Servings:</span>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-[#E5DACB]">
                    <button 
                      onClick={() => setDetailServings(prev => Math.max(1, prev - 1))}
                      className="w-6 h-6 rounded-lg bg-[#FAF4EA] text-[#292D29] hover:bg-[#EAE0D1] flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-[#292D29] w-6 text-center">{detailServings}</span>
                    <button 
                      onClick={() => setDetailServings(prev => Math.min(12, prev + 1))}
                      className="w-6 h-6 rounded-lg bg-[#FAF4EA] text-[#292D29] hover:bg-[#EAE0D1] flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[#4E564C] leading-relaxed">
                {detailRecipe.description}
              </p>

              {/* Chef Tip */}
              {detailRecipe.chefTip && (
                <div className="p-4 rounded-2xl bg-[#FFF6EE] border border-[#F0DDCB] flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#E89A55] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#945C2C]">Chef's Cooking Tip</p>
                    <p className="text-xs text-[#63574E] mt-0.5">{detailRecipe.chefTip}</p>
                  </div>
                </div>
              )}

              {/* Ingredients Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-serif font-bold text-[#292D29]">Ingredients Checklist</h4>
                  <span className="text-xs text-[#7A8578]">
                    {Object.values(detailCheckedIngredients).filter(Boolean).length} / {detailRecipe.ingredients.length} checked
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {detailRecipe.ingredients.map((ing, i) => {
                    const isChecked = !!detailCheckedIngredients[ing.name];
                    const scaledQty = getScaledQuantity(ing.baseQuantity, detailRecipe.servings, detailServings);

                    return (
                      <div 
                        key={i}
                        onClick={() => {
                          setDetailCheckedIngredients(prev => ({
                            ...prev,
                            [ing.name]: !prev[ing.name]
                          }));
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-[#F5FAF5] border-[#D0E6CF] text-[#869284]' 
                            : 'bg-[#FAF6F0] border-[#ECE2D2] text-[#292D29] hover:border-[#66856A]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isChecked ? 'bg-[#4D9662] border-[#4D9662] text-white' : 'border-[#CBD5C9] bg-white'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-xs ${isChecked ? 'line-through text-[#869284]' : 'font-medium'}`}>
                            {ing.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#66856A]">
                          {scaledQty} {ing.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Premium Recipe Notice if locked */}
              {!(!PREMIUM_RECIPE_IDS.has(detailRecipe.id) || purchasedRecipeIds.has(detailRecipe.id)) && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Chef Special Creation • ₹9</span>
                    </div>
                    <h4 className="font-serif font-bold text-slate-800 text-base">
                      Unlock Step-by-Step Cooking Mode & Voice Guidance
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Get full lifetime access to interactive checkpoints, timers, and multilingual voice assistant for ₹9.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleBuyNow(detailRecipe)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Buy Now for ₹9</span>
                    </button>
                    <button
                      onClick={() => {
                        const res = addToCart(detailRecipe);
                        showToast(res.message, res.success ? 'success' : 'info');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#F0E8DC] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleFavorite(detailRecipe.id)}
                    className="p-2.5 rounded-2xl bg-[#FAF4EA] hover:bg-[#EAE0D1] text-[#292D29] border border-[#E0D4C3] flex items-center gap-2 text-xs font-semibold"
                    title="Toggle Favorite"
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(detailRecipe.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{favorites.includes(detailRecipe.id) ? 'Saved' : 'Save Recipe'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!(!PREMIUM_RECIPE_IDS.has(detailRecipe.id) || purchasedRecipeIds.has(detailRecipe.id)) ? (
                    <button 
                      onClick={() => handleBuyNow(detailRecipe)}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-800/20"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Unlock Instructions for ₹9
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          startCookingRecipe(detailRecipe);
                          setTimeout(() => voiceAssistant.play(), 600);
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-[#E6F0E5] hover:bg-[#D5E6D4] text-[#2F4E34] text-xs font-bold flex items-center gap-1.5 border border-[#CBDDD0] transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#66856A]" />
                        <span>Voice Guide</span>
                      </button>
                      <button 
                        onClick={() => startCookingRecipe(detailRecipe)}
                        className="px-6 py-2.5 rounded-2xl bg-[#66856A] hover:bg-[#526F56] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#66856A]/20"
                      >
                        <Flame className="w-4 h-4 text-[#E89A55]" />
                        Start Interactive Cooking Mode
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- MEAL PICKER MODAL --- */}
      {mealModalSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-[#EBE2D3] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E8DC]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#292D29]">
                  Assign Recipe to {mealModalSlot.day} {mealModalSlot.meal.charAt(0).toUpperCase() + mealModalSlot.meal.slice(1)}
                </h3>
                <p className="text-xs text-[#737C71]">Choose from your digital cookbook</p>
              </div>
              <button 
                onClick={() => setMealModalSlot(null)}
                className="p-1 rounded-full text-[#737C71] hover:text-[#292D29]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {RECIPES_DATA.map(recipe => (
                <div 
                  key={recipe.id}
                  onClick={() => assignRecipeToMeal(recipe.id)}
                  className="p-2.5 rounded-2xl border border-[#EFE8DC] hover:border-[#66856A] hover:bg-[#FAF7F2] transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <img src={recipe.image} alt={recipe.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-serif font-bold text-[#292D29] truncate">{recipe.name}</h5>
                    <p className="text-[10px] text-[#768074]">{recipe.cuisine} • {recipe.prepTime + recipe.cookTime} mins</p>
                  </div>
                  <button className="px-3 py-1 rounded-xl bg-[#E6F0E5] text-[#2F4E34] text-xs font-bold">
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION MODAL --- */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-[#EBE2D3] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#292D29]">{confirmModal.title}</h3>
            <p className="text-xs text-[#636C61] leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 rounded-2xl bg-[#FAF6F0] text-[#292D29] text-xs font-bold border border-[#E8DDCD]"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 rounded-2xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING TOAST NOTIFICATION --- */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce" style={{ animationIterationCount: 1, animationDuration: '0.4s' }}>
          <div className="bg-[#292D29] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#E89A55]" />
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="text-white/60 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* --- AUTH MODAL & CART DRAWER --- */}
      <AuthModal />
      <CartDrawer onRecipeSelect={(recipe) => openRecipeDetails(recipe)} />

    </div>
  );
}
