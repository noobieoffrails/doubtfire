import { UserButton } from "@clerk/nextjs";
import {
  CalendarDays,
  CircleUserRound,
  Clock3,
  Globe2,
  Home,
  LockKeyhole,
  Settings,
} from "lucide-react";
import Image from "next/image";
import { cookies } from "next/headers";
import Link from "next/link";
import { setLanguage } from "@/app/actions";
import { RoutineArt } from "@/components/routine-art";
import { Button } from "@/components/ui/button";
import { dictionaries, getLocale, type Locale } from "@/i18n/config";

const routines = [
  { key: "weekly", iconTone: "sky", shape: "islandWeekly" },
  { key: "fortnightly", iconTone: "mint", shape: "islandFortnightly" },
  { key: "quarterly", iconTone: "lilac", shape: "islandQuarterly" },
] as const;

export default async function HomePage() {
  const locale = getLocale((await cookies()).get("doubtfire-language")?.value);
  const copy = dictionaries[locale];
  const allowsLocalPreview =
    process.env.NODE_ENV !== "production" &&
    process.env.DOUBTFIRE_ALLOW_UNAUTHENTICATED_PREVIEW === "1";

  return (
    <main className="appCanvas">
      <section className="appSurface" aria-labelledby="home-title">
        <header className="appHeader">
          <Link className="wordmark" href="/" aria-label={copy.doubtfireHome}>
            Doubtfire
          </Link>
          <div className="headerActions">
            <LanguageToggle locale={locale} label={copy.changeLanguage} />
            <div className="accountControl" aria-label={copy.account}>
              {allowsLocalPreview ? (
                <CircleUserRound className="accountPlaceholder" aria-hidden="true" strokeWidth={1.9} />
              ) : (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "clerkAvatar",
                      userButtonTrigger: "clerkTrigger",
                    },
                  }}
                />
              )}
            </div>
          </div>
        </header>

        <section className="welcome" aria-labelledby="home-title">
          <div className="welcomeCopy">
            <h1 id="home-title">{copy.greeting}</h1>
            <p>{copy.instruction}</p>
            <Button className="startButton" disabled aria-describedby="phase-note">
              <LockKeyhole aria-hidden="true" strokeWidth={2.2} />
              {copy.startCleaning}
            </Button>
            <p className="availabilityNote" id="phase-note">
              {copy.phaseNote}
            </p>
            <span className="coralDot" aria-hidden="true" />
          </div>
          <div className="careIsland" aria-hidden="true">
            <Image
              src="/images/home-care-island-cropped.png"
              alt=""
              width={720}
              height={900}
              priority
              className="careImage"
            />
          </div>
        </section>

        <section className="routineSection" aria-labelledby="routine-title">
          <div className="sectionHeading">
            <h2 id="routine-title">{copy.routines}</h2>
          </div>
          <ul className="routineList">
            {routines.map((routine) => (
              <li key={routine.key}>
                <button
                  className={`routineIsland ${routine.shape}`}
                  type="button"
                  disabled
                  aria-describedby="phase-note"
                >
                  <span className={`routineIcon ${routine.iconTone}`} aria-hidden="true">
                    <CalendarDays strokeWidth={2} />
                  </span>
                  <span>{copy[routine.key]}</span>
                  <span className="islandLinework" aria-hidden="true">
                    <RoutineArt variant={routine.key} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <nav className="bottomNav" aria-label={copy.primaryNavigation}>
          <Link className="navItem active" href="/" aria-current="page">
            <Home aria-hidden="true" strokeWidth={2.1} />
            <span>{copy.home}</span>
          </Link>
          <span className="navItem disabled" aria-disabled="true">
            <Clock3 aria-hidden="true" strokeWidth={2.1} />
            <span>{copy.history}</span>
          </span>
          <span className="navItem disabled" aria-disabled="true">
            <Settings aria-hidden="true" strokeWidth={2.1} />
            <span>{copy.settings}</span>
          </span>
        </nav>
      </section>
    </main>
  );
}

function LanguageToggle({ locale, label }: { locale: Locale; label: string }) {
  const nextLocale: Locale = locale === "en" ? "fi" : "en";

  return (
    <form action={setLanguage}>
      <input name="locale" type="hidden" value={nextLocale} />
      <button className="languageToggle" type="submit" aria-label={label}>
        <Globe2 aria-hidden="true" strokeWidth={2} />
        <span>{locale.toUpperCase()}</span>
      </button>
    </form>
  );
}
