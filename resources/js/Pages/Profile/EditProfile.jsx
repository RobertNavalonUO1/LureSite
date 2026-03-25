import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import AvatarCreatorModal from '@/Components/avatar/AvatarCreatorModal.jsx';
import { useI18n } from '@/i18n';
import UpdatePasswordForm from '@/Pages/Profile/Partials/UpdatePasswordForm.jsx';
import AvatarPicker from '@/Pages/Profile/components/AvatarPicker.jsx';
import ProfileSectionCard from '@/Pages/Profile/components/ProfileSectionCard.jsx';
import ProfileForm from '@/Pages/Profile/components/ProfileForm.jsx';
import AddressList from '@/Pages/Profile/components/AddressList.jsx';
import AddressFormModal from '@/Pages/Profile/components/AddressFormModal.jsx';
import ConfirmActionModal from '@/Pages/Profile/components/ConfirmActionModal.jsx';
import DeleteAccountSection from '@/Pages/Profile/components/DeleteAccountSection.jsx';
import ProfileToastRegion from '@/Pages/Profile/components/ProfileToastRegion.jsx';
import { useAddressBook } from '@/Pages/Profile/hooks/useAddressBook.js';
import { useToastStack } from '@/hooks/useToastStack.js';

export default function EditProfile() {
  const { profile, flash } = usePage().props;
  const { t } = useI18n();
  const { toasts, addToast, dismissToast } = useToastStack();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [addressModalState, setAddressModalState] = useState({ open: false, mode: 'create', address: null });
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [profileUser, setProfileUser] = useState(profile.user);

  const addressBook = useAddressBook({
    initialAddresses: profile.addresses,
    initialDefaultAddressId: profile.user.default_address_id,
    onToast: addToast,
  });

  useEffect(() => {
    setProfileUser(profile.user);
  }, [profile.user]);

  useEffect(() => {
    if (flash?.success) {
      addToast({ type: 'success', title: t('profile.modern.flash_completed_title'), message: flash.success });
    }

    if (flash?.error) {
      addToast({ type: 'error', title: t('profile.modern.flash_failed_title'), message: flash.error });
    }
  }, [flash?.success, flash?.error, addToast, t]);

  useEffect(() => {
    setProfileUser((current) => ({
      ...current,
      default_address_id: addressBook.defaultAddressId,
    }));
  }, [addressBook.defaultAddressId]);

  const openCreateAddressModal = () => {
    setAddressModalState({ open: true, mode: 'create', address: null });
  };

  const openEditAddressModal = (address) => {
    setAddressModalState({ open: true, mode: 'edit', address });
  };

  const closeAddressModal = () => {
    setAddressModalState({ open: false, mode: 'create', address: null });
  };

  const handleAvatarSelect = (avatarUrl) => {
    setProfileUser((current) => ({ ...current, avatar: avatarUrl }));
    setAvatarModalOpen(false);
    addToast({
      type: 'success',
      title: t('profile.modern.avatar_updated_title'),
      message: t('profile.modern.avatar_updated_message'),
    });
  };

  const handleAddressSubmit = async (payload) => {
    if (addressModalState.mode === 'edit' && addressModalState.address) {
      await addressBook.updateAddress(addressModalState.address.id, payload);
      return;
    }

    await addressBook.createAddress(payload);
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;

    try {
      await addressBook.deleteAddress(addressToDelete.id);
      setAddressToDelete(null);
    } catch (error) {
      if (error.type !== 'validation') {
        setAddressToDelete(null);
      }
    }
  };

  const stats = useMemo(() => ([
    {
      label: t('profile.modern.stats.addresses_saved'),
      value: String(addressBook.addresses.length).padStart(2, '0'),
    },
    {
      label: t('profile.modern.stats.default_address'),
      value: addressBook.defaultAddressId ? t('profile.modern.stats.active') : t('profile.modern.stats.pending'),
    },
    {
      label: t('profile.modern.stats.email_status'),
      value: profileUser.email_verified_at ? t('profile.modern.stats.verified') : t('profile.modern.stats.pending'),
    },
  ]), [addressBook.addresses.length, addressBook.defaultAddressId, profileUser.email_verified_at, t]);

  return (
    <>
      <Head title={t('profile.title')} />

      <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_28%,_#f8fafc_100%)] text-slate-900">
        <ProfileToastRegion toasts={toasts} onDismiss={dismissToast} />
        <Header />

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <AvatarPicker avatar={profileUser.avatar} onOpen={() => setAvatarModalOpen(true)} />

          <section className="grid gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/60 bg-white/80 px-5 py-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <ProfileSectionCard
              title={t('profile.modern.sections.personal_title')}
              description={t('profile.modern.sections.personal_description')}
            >
              <ProfileForm
                user={profileUser}
                addresses={addressBook.addresses}
                paymentMethods={profile.paymentMethods}
                onSuccess={(message) => {
                  addToast({ type: 'success', title: t('profile.modern.profile_updated_title'), message });
                }}
              />
            </ProfileSectionCard>

            <ProfileSectionCard
              title={t('profile.modern.sections.security_title')}
              description={t('profile.modern.sections.security_description')}
            >
              <div className="space-y-8">
                <UpdatePasswordForm />
                <DeleteAccountSection
                  onSuccess={(message) => {
                    addToast({ type: 'success', title: t('profile.modern.account_deleted_title'), message });
                  }}
                />
              </div>
            </ProfileSectionCard>
          </div>

          <ProfileSectionCard
            title={t('profile.modern.sections.addresses_title')}
            description={t('profile.modern.sections.addresses_description')}
          >
            <AddressList
              addresses={addressBook.addresses}
              busyAddressId={addressBook.busyAddressId}
              busyAction={addressBook.busyAction}
              onCreate={openCreateAddressModal}
              onEdit={openEditAddressModal}
              onDelete={(address) => setAddressToDelete(address)}
              onSetDefault={async (address) => {
                await addressBook.markAsDefault(address.id);
              }}
            />
          </ProfileSectionCard>
        </main>

        <Footer />
      </div>

      <AddressFormModal
        show={addressModalState.open}
        mode={addressModalState.mode}
        address={addressModalState.address}
        onClose={closeAddressModal}
        onSubmit={handleAddressSubmit}
      />

      <ConfirmActionModal
        show={Boolean(addressToDelete)}
        onClose={() => setAddressToDelete(null)}
        title={t('profile.modern.address_delete_title')}
        description={addressToDelete ? t('profile.modern.address_delete_description', {
          street: addressToDelete.street,
          city: addressToDelete.city,
        }) : ''}
        confirmLabel={t('profile.modern.address_delete_confirm')}
        confirmTone="danger"
        onConfirm={confirmDeleteAddress}
        processing={addressBook.busyAction === 'delete'}
      />

      <AvatarCreatorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSelect={handleAvatarSelect}
      />
    </>
  );
}
