export const PROFILE_AVATAR_COUNT = 15;

export const PROFILE_AVATAR_DEFAULTS = Array.from({ length: PROFILE_AVATAR_COUNT }, (_, index) => (
  `/avatars/defaults/avatar-${String(index + 1).padStart(2, '0')}.svg`
));

const normalizeAvatarUrl = (value) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(?:https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, '')}`;
};

const hashSeed = (value) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const resolveSeedValue = (seed) => {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.abs(seed);
  }

  if (typeof seed === 'string' && seed.trim()) {
    return hashSeed(seed.trim());
  }

  if (seed && typeof seed === 'object') {
    if (typeof seed.id === 'number' && Number.isFinite(seed.id)) {
      return Math.abs(seed.id);
    }

    const composite = [seed.email, seed.name, seed.lastname, seed.phone]
      .filter((value) => typeof value === 'string' && value.trim())
      .join('|');

    if (composite) {
      return hashSeed(composite);
    }
  }

  return 0;
};

export const getDefaultProfileAvatar = (seed) => {
  const seedValue = resolveSeedValue(seed);
  return PROFILE_AVATAR_DEFAULTS[seedValue % PROFILE_AVATAR_DEFAULTS.length];
};

export const buildProfileAvatarCandidates = ({ src, avatar, photoUrl, seed } = {}) => {
  const preferred = [src, avatar, photoUrl].map(normalizeAvatarUrl).filter(Boolean);
  const startIndex = PROFILE_AVATAR_DEFAULTS.indexOf(getDefaultProfileAvatar(seed));
  const rotatedDefaults = PROFILE_AVATAR_DEFAULTS.map((_, offset) => (
    PROFILE_AVATAR_DEFAULTS[(startIndex + offset) % PROFILE_AVATAR_DEFAULTS.length]
  ));

  return [...new Set([...preferred, ...rotatedDefaults])];
};
