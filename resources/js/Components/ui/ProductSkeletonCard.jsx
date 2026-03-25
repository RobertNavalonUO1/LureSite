import React from 'react';

const ProductSkeletonCard = () => {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm animate-pulse">
      <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="h-3 w-20 rounded-full bg-slate-200" />
        <div className="h-4 w-3/4 rounded-full bg-slate-300" />

        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-3 w-6 rounded-full bg-slate-200" />
          ))}
        </div>

        <div className="h-5 w-32 rounded-full bg-slate-300" />
        <div className="h-3 w-40 rounded-full bg-slate-200" />

        <div className="mt-2 space-y-2">
          <div className="h-3 w-full rounded-full bg-slate-200" />
          <div className="h-3 w-5/6 rounded-full bg-slate-200" />
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="h-10 w-full rounded-full bg-slate-200 sm:w-1/2" />
          <div className="h-10 w-full rounded-full border border-slate-200 bg-white sm:w-1/2" />
        </div>

        <div className="h-3 w-32 rounded-full bg-slate-200" />
      </div>
    </div>
  );
};

export default ProductSkeletonCard;
