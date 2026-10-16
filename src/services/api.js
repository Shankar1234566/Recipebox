// RecipeBox Frontend API Client

// Resolve API base URL: Reads VITE_API_BASE_URL or VITE_API_URL if configured,
// otherwise defaults to '/api' for same-domain or Vite proxy routing.
const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  return '/api';
};

const BASE_URL = getApiBaseUrl();

// Helper to get stored auth token
export const getStoredToken = () => {
  return localStorage.getItem('recipebox_token') || '';
};

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('recipebox_token', token);
  } else {
    localStorage.removeItem('recipebox_token');
  }
};

// Common request wrapper
async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const targetUrl = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}/${endpoint.replace(/^\/+/, '')}`;

  let response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
      credentials: 'omit',
    });
  } catch (netErr) {
    throw new Error(
      `Unable to connect to RecipeBox backend API at ${targetUrl}. Please ensure the server is running and CORS is configured.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'An unexpected error occurred');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// 1. Recipes APIs
export const apiGetRecipes = async () => {
  return request('/recipes');
};

export const apiGetRecipeById = async (id) => {
  return request(`/recipes/${id}`);
};

export const apiGetMyPurchases = async () => {
  return request('/recipes/my-purchases');
};

// 2. Auth APIs
export const apiSendOtp = async (identifier, type) => {
  return request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, type }),
  });
};

export const apiVerifyOtp = async (identifier, otp, type) => {
  return request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ identifier, otp, type }),
  });
};

export const apiGetMe = async () => {
  return request('/auth/me');
};

export const apiUpdateProfile = async (name) => {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
};

export const apiLogout = async () => {
  setStoredToken(null);
  return request('/auth/logout', { method: 'POST' }).catch(() => ({}));
};

// 3. Payment APIs
export const apiCreateOrder = async (recipeIds) => {
  return request('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ recipeIds }),
  });
};

export const apiVerifyPayment = async (paymentData) => {
  return request('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
};

export const apiCancelPayment = async (orderId, reason = 'User dismissed checkout') => {
  return request('/payments/cancel', {
    method: 'POST',
    body: JSON.stringify({ razorpay_order_id: orderId, reason }),
  }).catch(() => ({}));
};

export const apiFailPayment = async (orderId, errorDescription) => {
  return request('/payments/fail', {
    method: 'POST',
    body: JSON.stringify({ razorpay_order_id: orderId, error_description: errorDescription }),
  }).catch(() => ({}));
};
