import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isRecipeUnlocked } = useAuth();
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('recipebox_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('recipebox_cart', JSON.stringify(cartItems));
    } catch (e) {
      // ignore
    }
  }, [cartItems]);

  // Remove items that become unlocked (e.g. after user purchases them)
  useEffect(() => {
    setCartItems(prev => prev.filter(item => !isRecipeUnlocked(item)));
  }, [isRecipeUnlocked]);

  const addToCart = (recipe) => {
    if (isRecipeUnlocked(recipe)) {
      return { success: false, message: 'You already own or have access to this recipe!' };
    }

    if (cartItems.some(item => item.id === recipe.id)) {
      return { success: false, message: 'Recipe is already in your cart' };
    }

    setCartItems(prev => [...prev, {
      id: recipe.id,
      name: recipe.name,
      tagline: recipe.tagline,
      price: recipe.price || 9,
      image: recipe.image,
      category: recipe.category,
    }]);

    setIsCartOpen(true);
    return { success: true, message: 'Added to cart' };
  };

  const removeFromCart = (recipeId) => {
    setCartItems(prev => prev.filter(item => item.id !== recipeId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Subtotal in Rupees (server price ₹9)
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price || 9), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        cartCount: cartItems.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
