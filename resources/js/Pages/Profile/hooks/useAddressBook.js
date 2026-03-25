import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { addressClient } from '@/Pages/Profile/api/addressClient.js';

const syncDefaultState = (addresses, defaultAddressId) =>
  addresses.map((address) => ({
    ...address,
    is_default: Number(address.id) === Number(defaultAddressId),
  }));

export function useAddressBook({ initialAddresses = [], initialDefaultAddressId = null, onToast }) {
  const { t } = useI18n();
  const [addresses, setAddresses] = useState(syncDefaultState(initialAddresses, initialDefaultAddressId));
  const [defaultAddressId, setDefaultAddressId] = useState(initialDefaultAddressId);
  const [busyAddressId, setBusyAddressId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const applyDefaultState = useCallback((nextAddresses, nextDefaultAddressId) => {
    setDefaultAddressId(nextDefaultAddressId);
    setAddresses(syncDefaultState(nextAddresses, nextDefaultAddressId));
  }, []);

  useEffect(() => {
    applyDefaultState(initialAddresses, initialDefaultAddressId);
  }, [applyDefaultState, initialAddresses, initialDefaultAddressId]);

  const handleError = useCallback((error, fallbackMessage) => {
    onToast?.({
      type: 'error',
      title: t('profile.address_book.error_title'),
      message: error.message || fallbackMessage,
    });

    throw error;
  }, [onToast, t]);

  const createAddress = useCallback(async (payload) => {
    setBusyAction('create');

    try {
      const response = await addressClient.create(payload);
      const nextDefaultId = response.default_address_id ?? defaultAddressId;
      applyDefaultState([response.address, ...addresses], nextDefaultId);
      onToast?.({ type: 'success', title: t('profile.address_book.saved_title'), message: response.message });
      return response.address;
    } catch (error) {
      return handleError(error, t('profile.address_book.save_failed'));
    } finally {
      setBusyAction(null);
    }
  }, [addresses, applyDefaultState, defaultAddressId, handleError, onToast, t]);

  const updateAddress = useCallback(async (addressId, payload) => {
    setBusyAddressId(addressId);
    setBusyAction('update');

    try {
      const response = await addressClient.update(addressId, payload);
      const nextDefaultId = response.default_address_id ?? defaultAddressId;
      const nextAddresses = addresses.map((address) => (
        Number(address.id) === Number(addressId) ? response.address : address
      ));

      applyDefaultState(nextAddresses, nextDefaultId);
      onToast?.({ type: 'success', title: t('profile.address_book.updated_title'), message: response.message });
      return response.address;
    } catch (error) {
      return handleError(error, t('profile.address_book.update_failed'));
    } finally {
      setBusyAddressId(null);
      setBusyAction(null);
    }
  }, [addresses, applyDefaultState, defaultAddressId, handleError, onToast, t]);

  const deleteAddress = useCallback(async (addressId) => {
    setBusyAddressId(addressId);
    setBusyAction('delete');

    try {
      const response = await addressClient.destroy(addressId);
      const nextAddresses = addresses.filter((address) => Number(address.id) !== Number(addressId));
      const nextDefaultId = response.default_address_id ?? defaultAddressId;

      applyDefaultState(nextAddresses, nextDefaultId);
      onToast?.({ type: 'success', title: t('profile.address_book.deleted_title'), message: response.message });
      return response;
    } catch (error) {
      return handleError(error, t('profile.address_book.delete_failed'));
    } finally {
      setBusyAddressId(null);
      setBusyAction(null);
    }
  }, [addresses, applyDefaultState, defaultAddressId, handleError, onToast, t]);

  const markAsDefault = useCallback(async (addressId) => {
    setBusyAddressId(addressId);
    setBusyAction('default');

    try {
      const response = await addressClient.setDefault(addressId);
      applyDefaultState(addresses, response.default_address_id);
      onToast?.({ type: 'success', title: t('profile.address_book.default_title'), message: response.message });
      return response;
    } catch (error) {
      return handleError(error, t('profile.address_book.default_failed'));
    } finally {
      setBusyAddressId(null);
      setBusyAction(null);
    }
  }, [addresses, applyDefaultState, handleError, onToast, t]);

  return useMemo(() => ({
    addresses,
    defaultAddressId,
    busyAddressId,
    busyAction,
    createAddress,
    updateAddress,
    deleteAddress,
    markAsDefault,
  }), [addresses, defaultAddressId, busyAddressId, busyAction, createAddress, updateAddress, deleteAddress, markAsDefault]);
}
