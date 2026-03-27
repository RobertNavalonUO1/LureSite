const CART_UPDATED_EVENT = 'cart:updated';
const CART_ITEM_ADDED_EVENT = 'cart:item-added';

export const normaliseCartItems = (items) => {
  if (Array.isArray(items)) {
    return items;
  }

  if (items && typeof items === 'object') {
    return Object.values(items);
  }

  return [];
};

export const formatCartTotal = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value.toFixed(2);
  }

  if (typeof value === 'string') {
    return value;
  }

  return '0.00';
};

export const buildCartState = (payload = {}) => ({
  cartItems: normaliseCartItems(payload.cartItems),
  cartCount: Number(payload.cartCount ?? 0),
  total: formatCartTotal(payload.total),
  message: payload.message,
});

const buildAddedItemState = (payload = {}) => ({
  id: payload.id ?? null,
  title: payload.title ?? '',
  quantity: Number(payload.quantity ?? 1),
  price: Number(payload.price ?? 0),
  image_url: payload.image_url || payload.image_url_full || '/images/logo.png',
  image_url_full: payload.image_url_full || payload.image_url || '/images/logo.png',
  message: payload.message,
});

const getCsrfToken = () => {
  if (typeof document === 'undefined') {
    return '';
  }

  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
};

export const emitCartUpdated = (payload = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: buildCartState(payload),
    }),
  );
};

export const emitCartItemAdded = (payload = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CART_ITEM_ADDED_EVENT, {
      detail: buildAddedItemState(payload),
    }),
  );
};

export const subscribeToCartUpdates = (handler) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const listener = (event) => {
    handler?.(buildCartState(event.detail ?? {}));
  };

  window.addEventListener(CART_UPDATED_EVENT, listener);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, listener);
  };
};

export const subscribeToCartAdditions = (handler) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const listener = (event) => {
    handler?.(buildAddedItemState(event.detail ?? {}));
  };

  window.addEventListener(CART_ITEM_ADDED_EVENT, listener);

  return () => {
    window.removeEventListener(CART_ITEM_ADDED_EVENT, listener);
  };
};

const requestCart = async (endpoint, options = {}) => {
  const { method = 'POST', data, meta } = options;
  const csrfToken = getCsrfToken();
  const response = await fetch(endpoint, {
    method,
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
    },
    credentials: 'same-origin',
    ...(data ? { body: JSON.stringify(data) } : {}),
  });

  if (!response.ok) {
    throw new Error(`Cart request failed with status ${response.status}`);
  }

  const payload = buildCartState(await response.json());
  emitCartUpdated(payload);

  if (endpoint.includes('/add') && meta) {
    emitCartItemAdded({
      ...meta,
      message: payload.message,
    });
  }

  return payload;
};

export const fetchCartSummary = () => requestCart('/cart/summary', { method: 'GET' });
export const addCartItem = (productId, data = {}, meta = null) => requestCart(`/cart/${productId}/add`, { data, meta });
export const removeCartItem = (productId) => requestCart(`/cart/${productId}/remove`);
export const incrementCartItem = (productId) => requestCart(`/cart/${productId}/increment`);
export const decrementCartItem = (productId) => requestCart(`/cart/${productId}/decrement`);