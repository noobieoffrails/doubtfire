"use client";

import { useLocale } from "@/components/locale-provider";
import { dictionaries } from "@/i18n/config";

export function RouteLoading({ variant }: { variant: "run" | "settings" }) {
  const locale = useLocale();
  const copy = dictionaries[locale];

  if (variant === "settings") {
    return (
      <main className="settingsCanvas" aria-busy="true">
        <p className="srOnly" role="status">
          {copy.loading}
        </p>
        <section className="settingsSurface" aria-hidden="true">
          <div className="loadingHeader">
            <span className="loadingWordmark" />
            <span className="loadingControl" />
          </div>
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
        </section>
      </main>
    );
  }

  return (
    <main className="runCanvas" aria-busy="true">
      <p className="srOnly" role="status">
        {copy.loading}
      </p>
      <section className="runSurface" aria-hidden="true">
        <div className="loadingHeader">
          <span className="loadingWordmark" />
          <span className="loadingControl" />
        </div>
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
      </section>
    </main>
  );
}
