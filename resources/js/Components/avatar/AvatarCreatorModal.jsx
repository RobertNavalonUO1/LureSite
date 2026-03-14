import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useI18n } from '@/i18n';
import { PROFILE_AVATAR_DEFAULTS } from '@/utils/profileAvatar.js';

const AvatarModel = ({ gender, bodyType, shirtColor, pantsColor, hairColor }) => {
  const bodyHeight = bodyType === 'tall' ? 1.6 : bodyType === 'short' ? 1.0 : 1.2;

  return (
    <group>
      <mesh position={[0, bodyHeight / 2, 0]}>
        <cylinderGeometry args={[0.5, 0.5, bodyHeight, 32]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>

      <mesh position={[0, bodyHeight + 0.6, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>

      <mesh position={[-0.15, bodyHeight + 0.7, 0.35]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0.15, bodyHeight + 0.7, 0.35]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>

      <mesh position={[0, bodyHeight + 0.6, 0.4]}>
        <coneGeometry args={[0.05, 0.2, 16]} />
        <meshStandardMaterial color="#f5b5a2" />
      </mesh>

      <mesh position={[0, bodyHeight + 0.5, 0.35]}>
        <boxGeometry args={[0.2, 0.05, 0.01]} />
        <meshStandardMaterial color="red" />
      </mesh>

      <mesh position={[-0.45, bodyHeight + 0.6, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>
      <mesh position={[0.45, bodyHeight + 0.6, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#f5d7b2" />
      </mesh>

      <mesh position={[0, bodyHeight + 0.95, 0]}>
        <sphereGeometry args={[0.45, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>

      {gender === 'female' ? (
        <mesh position={[0, bodyHeight + 1.1, 0]}>
          <coneGeometry args={[0.6, 0.5, 32]} />
          <meshStandardMaterial color="#ff66cc" />
        </mesh>
      ) : null}

      <mesh position={[0, bodyHeight - 0.3, 0]}>
        <boxGeometry args={[1, 0.6, 0.6]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      <mesh position={[-0.2, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
      <mesh position={[0.2, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color={pantsColor} />
      </mesh>
    </group>
  );
};

const AvatarCreatorModal = ({ isOpen, onClose, onSelect }) => {
  const { t } = useI18n();
  const [shirtColor, setShirtColor] = useState('#00aaff');
  const [pantsColor, setPantsColor] = useState('#222222');
  const [hairColor, setHairColor] = useState('#552200');
  const [gender, setGender] = useState('male');
  const [bodyType, setBodyType] = useState('average');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const canvasContainerRef = useRef(null);

  if (!isOpen) return null;

  const submitAvatar = async (payload, fallbackMessage, action) => {
    setError('');
    setProcessing(action);

    try {
      const response = await axios.post('/api/avatar-upload', payload);
      onSelect?.(response.data.url);
      onClose?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || fallbackMessage);
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirm = async () => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');

    if (!canvas) {
      setError(t('profile.avatar_modal.canvas_unavailable'));
      return;
    }

    await submitAvatar({ image: canvas.toDataURL('image/png') }, t('profile.avatar_modal.save_failed'), 'save');
  };

  const handleReset = async () => {
    await submitAvatar({ image: null }, t('profile.avatar_modal.reset_failed'), 'reset');
  };

  const handlePresetSelect = async (preset) => {
    await submitAvatar({ preset }, t('profile.avatar_modal.preset_failed'), 'preset');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="avatar-modal-title" className="text-2xl font-bold text-slate-950">
              {t('profile.avatar_modal.title')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t('profile.avatar_modal.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={t('common.close_notification')}
          >
            x
          </button>
        </div>

        <div ref={canvasContainerRef} className="mt-5 h-80 w-full overflow-hidden rounded-3xl bg-slate-100">
          <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
            <ambientLight />
            <directionalLight position={[3, 5, 2]} intensity={1.5} />
            <OrbitControls enablePan={false} />
            <AvatarModel
              gender={gender}
              bodyType={bodyType}
              shirtColor={shirtColor}
              pantsColor={pantsColor}
              hairColor={hairColor}
            />
          </Canvas>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <div>
            <label className="mb-1 block font-medium text-slate-700">{t('profile.avatar_modal.shirt')}</label>
            <input type="color" value={shirtColor} onChange={(event) => setShirtColor(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700">{t('profile.avatar_modal.pants')}</label>
            <input type="color" value={pantsColor} onChange={(event) => setPantsColor(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700">{t('profile.avatar_modal.hair')}</label>
            <input type="color" value={hairColor} onChange={(event) => setHairColor(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700">{t('profile.avatar_modal.gender')}</label>
            <select value={gender} onChange={(event) => setGender(event.target.value)} className="w-full rounded-xl border border-slate-300 p-2">
              <option value="male">{t('profile.avatar_modal.gender_male')}</option>
              <option value="female">{t('profile.avatar_modal.gender_female')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700">{t('profile.avatar_modal.body_type')}</label>
            <select value={bodyType} onChange={(event) => setBodyType(event.target.value)} className="w-full rounded-xl border border-slate-300 p-2">
              <option value="short">{t('profile.avatar_modal.body_short')}</option>
              <option value="average">{t('profile.avatar_modal.body_average')}</option>
              <option value="tall">{t('profile.avatar_modal.body_tall')}</option>
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
              {t('profile.avatar_modal.presets_title')}
            </h3>
            <p className="text-sm text-slate-500">
              {t('profile.avatar_modal.presets_subtitle')}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {PROFILE_AVATAR_DEFAULTS.map((preset, index) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                disabled={processing !== null}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={t('profile.avatar_modal.preset_select', { index: index + 1 })}
                title={t('profile.avatar_modal.preset_select', { index: index + 1 })}
              >
                <img src={preset} alt="" className="h-16 w-full rounded-xl object-cover sm:h-20" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleReset}
            disabled={processing !== null}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing === 'reset' ? t('profile.avatar_modal.resetting') : t('profile.avatar_modal.reset')}
          </button>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={processing !== null}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('profile.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={processing !== null}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {processing === 'save'
                ? t('profile.avatar_modal.saving')
                : processing === 'preset'
                  ? t('profile.avatar_modal.preset_saving')
                  : t('profile.avatar_modal.save')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AvatarCreatorModal;
