"use client";

import type { ReactNode } from "react";

import { useLocale } from "@/components/locale-provider";
import { dictionaries } from "@/i18n/config";

function LoadingShell({
  canvasClassName,
  children,
  loadingText,
  surfaceClassName,
}: {
  canvasClassName: string;
  children: ReactNode;
  loadingText: string;
  surfaceClassName: string;
}) {
  return (
    <main className={canvasClassName} aria-busy="true">
      <p className="srOnly" role="status">
        {loadingText}
      </p>
      <section className={surfaceClassName} aria-hidden="true">
        <div className="loadingHeader">
          <span className="loadingWordmark" />
          <span className="loadingControl" />
        </div>
        {children}
      </section>
    </main>
  );
}

export function RouteLoading({ variant }: { variant: "run" | "settings" }) {
  const locale = useLocale();
  const copy = dictionaries[locale];

  if (variant === "settings") {
    return (
      <LoadingShell
        canvasClassName="settingsCanvas"
        loadingText={copy.loading}
        surfaceClassName="settingsSurface"
      >
        <div className="settingsLoadingContent">
          <div className="settingsLoadingIntro">
            <span className="loadingHeading" />
            <span className="loadingCopy" />
          </div>
          <div className="loadingRows">
            <span />
            <span />
            <span />
          </div>
        </div>
      </LoadingShell>
    );
  }

  return (
    <LoadingShell
      canvasClassName="runCanvas"
      loadingText={copy.loading}
      surfaceClassName="runSurface"
    >
      <div className="runLoadingContent">
        <span className="loadingHeading" />
        <div className="loadingChoices">
          <span />
          <span />
        </div>
        <div className="loadingRooms">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </LoadingShell>
  );
}
