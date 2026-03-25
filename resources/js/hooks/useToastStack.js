import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION = 4200;

export function useToastStack() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timeout = timersRef.current.get(id);

    if (timeout) {
      clearTimeout(timeout);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'success', title, message, duration = DEFAULT_DURATION }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nextToast = { id, type, title, message };

    setToasts((current) => [...current, nextToast]);

    const timeout = window.setTimeout(() => {
      dismissToast(id);
    }, duration);

    timersRef.current.set(id, timeout);

    return id;
  }, [dismissToast]);

  useEffect(() => () => {
    timersRef.current.forEach((timeout) => clearTimeout(timeout));
    timersRef.current.clear();
  }, []);

  return {
    toasts,
    addToast,
    dismissToast,
  };
}
