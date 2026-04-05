import React, { useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../components/ui/button';
import Sidebar from './Sidebar';

const AppShell = ({
  children,
  title = 'CrediControl',
  subtitle = '',
  rightAction = null,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerSubtitle = useMemo(() => subtitle, [subtitle]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="min-h-screen lg:pl-64">
        {/* Header mobile / tablet */}
        <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-xl lg:hidden">
          <div className="px-4 py-3 sm:px-5">
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
          </div>
        </header>

        {/* Header desktop */}
        <header className="hidden border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-xl lg:block">
          <div className="flex items-center justify-between gap-6 px-8 py-6">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-neutral-50">
                {title}
              </h1>
              {headerSubtitle ? (
                <p className="mt-1 text-sm text-neutral-400">{headerSubtitle}</p>
              ) : null}
            </div>

            {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
          </div>
        </header>

        <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;