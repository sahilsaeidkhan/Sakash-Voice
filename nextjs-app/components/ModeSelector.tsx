'use client';

type PracticeModeRoute = '/practice/table-topic' | '/practice/call-friend';

interface ModeSelectorProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSelect: (route: PracticeModeRoute) => void;
}

export default function ModeSelector({ isOpen, isLoading = false, onSelect }: ModeSelectorProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 p-4 animate-fade-in">
      <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center">
        <div className="glass-panel w-full rounded-3xl p-8 shadow-2xl animate-slide-in-up dark:bg-gray-900/70">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-700">Voice Lab</p>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Sakash Voice</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">Pick one lane and practice with full focus.</p>
            </div>
            <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              2 Practice Modes
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onSelect('/practice/table-topic')}
              className="group rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-100 p-6 text-left transition hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-700/40 dark:from-cyan-900/30 dark:to-sky-900/20"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Structured</p>
              <p className="mb-2 text-2xl font-black text-slate-900 dark:text-white">Practice Table Topic</p>
              <p className="text-slate-700 dark:text-slate-300">Toastmasters-style impromptu speaking with transcript and AI feedback.</p>
              <p className="mt-4 text-sm font-semibold text-cyan-800 group-hover:translate-x-1 transition dark:text-cyan-300">Start session →</p>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => onSelect('/practice/call-friend')}
              className="group rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-100 p-6 text-left transition hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700/40 dark:from-emerald-900/30 dark:to-lime-900/20"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Conversational</p>
              <p className="mb-2 text-2xl font-black text-slate-900 dark:text-white">Call to Friend</p>
              <p className="text-slate-700 dark:text-slate-300">Independent call simulation with timer and optional recording.</p>
              <p className="mt-4 text-sm font-semibold text-emerald-800 group-hover:translate-x-1 transition dark:text-emerald-300">Start call mode →</p>
            </button>
          </div>

          {isLoading && (
            <p className="mt-6 text-sm font-semibold text-slate-600 dark:text-slate-300">Opening selected mode...</p>
          )}
        </div>
      </div>
    </div>
  );
}
