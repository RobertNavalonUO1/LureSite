export default function ProfileSectionCard({ title, description, children, aside }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div className="pt-6">{children}</div>
    </section>
  );
}
