import React, { useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../components/ui/button';
import Sidebar from './Sidebar';

const AppShell = ({
  children,
  title = 'CrediControl',
  subtitle = '',
  rightAction = null,
  headerVariant = 'default',
  headerIcon: HeaderIcon = null,
  headerBadge = '',
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerSubtitle = useMemo(() => subtitle, [subtitle]);
  const isPremiumHeader = headerVariant === 'premium';

  const headerBadgeNode =
    headerBadge || HeaderIcon ? (
      <div
        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
          isPremiumHeader
            ? 'border border-sky-400/20 bg-sky-400/10 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.10)]'
            : 'border border-neutral-700 bg-neutral-900 text-neutral-300'
        }`}
      >
        {HeaderIcon ? <HeaderIcon className="h-4 w-4" /> : null}
        {headerBadge ? <span>{headerBadge}</span> : null}
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="min-h-screen lg:pl-64">
        {/* Header mobile / tablet */}
        <header
          className={`sticky top-0 z-30 lg:hidden ${
            isPremiumHeader
              ? 'border-b border-white/6 bg-neutral-950/80 backdrop-blur-xl'
              : 'border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-xl'
          }`}
        >
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            {isPremiumHeader ? (
              <div className="relative overflow-hidden rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.12),transparent_32%),linear-gradient(180deg,rgba(17,24,39,0.82),rgba(10,10,10,0.92))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="pointer-events-none absolute -left-16 top-0 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/35 to-transparent" />

                <div className="relative flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setMobileOpen(true)}
                      className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-black/25 p-0 text-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/5"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>

                    <div className="min-w-0 flex-1">
                      {headerBadgeNode ? <div className="mb-2.5">{headerBadgeNode}</div> : null}

                      <h1 className="truncate text-base font-semibold tracking-tight text-neutral-50 sm:text-lg">
                        {title}
                      </h1>

                      {headerSubtitle ? (
                        <p className="mt-1.5 line-clamp-2 text-xs text-neutral-400 sm:text-sm">
                          {headerSubtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {rightAction ? (
                    <div className="flex w-full justify-stretch sm:justify-end pt-1">
                      <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
                        {rightAction}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMobileOpen(true)}
                    className="h-11 w-11 shrink-0 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-0 text-neutral-100 hover:bg-neutral-800"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>

                  <div className="min-w-0 flex-1">
                    {headerBadgeNode ? <div className="mb-2">{headerBadgeNode}</div> : null}

                    <h1 className="truncate text-base font-bold tracking-tight text-neutral-50 sm:text-lg">
                      {title}
                    </h1>

                    {headerSubtitle ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400 sm:text-sm">
                        {headerSubtitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                {rightAction ? (
                  <div className="flex w-full justify-stretch sm:justify-end">
                    <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
                      {rightAction}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </header>

        {/* Header desktop */}
        <header
          className={`hidden lg:block ${
            isPremiumHeader
              ? 'border-b border-white/6 bg-neutral-950/65 backdrop-blur-xl'
              : 'border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-xl'
          }`}
        >
          <div className="px-8 py-7">
            {isPremiumHeader ? (
              <div className="relative overflow-hidden rounded-[32px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.12),transparent_32%),linear-gradient(180deg,rgba(17,24,39,0.82),rgba(10,10,10,0.92))] p-7 lg:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/35 to-transparent" />

                <div className="relative flex items-center justify-between gap-8">
                  <div className="min-w-0">
                    {headerBadgeNode ? <div className="mb-3">{headerBadgeNode}</div> : null}

                    <h1 className="truncate text-2xl font-semibold tracking-tight text-neutral-50">
                      {title}
                    </h1>

                    {headerSubtitle ? (
                      <p className="mt-2 text-sm text-neutral-400">{headerSubtitle}</p>
                    ) : null}
                  </div>

                  {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-6">
                <div className="min-w-0">
                  {headerBadgeNode ? <div className="mb-3">{headerBadgeNode}</div> : null}

                  <h1 className="truncate text-2xl font-bold tracking-tight text-neutral-50">
                    {title}
                  </h1>

                  {headerSubtitle ? (
                    <p className="mt-1 text-sm text-neutral-400">{headerSubtitle}</p>
                  ) : null}
                </div>

                {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
              </div>
            )}
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;