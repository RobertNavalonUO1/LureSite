import { useEffect, useMemo, useState } from 'react';
import { buildProfileAvatarCandidates } from '@/utils/profileAvatar.js';

export default function ProfileAvatar({
  user,
  src,
  photoUrl,
  alt,
  className,
  ...rest
}) {
  const candidates = useMemo(() => buildProfileAvatarCandidates({
    src,
    avatar: user?.avatar,
    photoUrl: photoUrl ?? user?.photo_url,
    seed: user ?? src,
  }), [photoUrl, src, user]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  return (
    <img
      {...rest}
      src={candidates[Math.min(candidateIndex, candidates.length - 1)]}
      alt={alt}
      className={className}
      onError={() => {
        setCandidateIndex((current) => (
          current < candidates.length - 1 ? current + 1 : current
        ));
      }}
    />
  );
}
