import { UserButton } from "@clerk/nextjs";
import {
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Home,
  Play,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  ReopenRunForm,
  StartRunForm,
} from "@/components/home-run-actions";
import { LanguageToggle } from "@/components/language-toggle";
import { RunChangeRefresh } from "@/components/run-change-refresh";
import { RoutineArt } from "@/components/routine-art";
import { createContentCatalog } from "@/content/content-catalog";
import { getDatabase } from "@/db/client";
import { dictionaries } from "@/i18n/config";
import { formatPlural } from "@/i18n/plural";
import { getRequestLocale } from "@/i18n/server";
import { allowsLocalPreview } from "@/lib/local-preview";
import { requireAllowedUser } from "@/auth/server";
import {
  reopenRunFromHomeAction,
  startRunAction,
} from "@/app/run/actions";
import { createRunManager } from "@/runs/run-manager";

const routineStyles = [
  { iconTone: "sky", shape: "islandSky", art: "weekly" },
  { iconTone: "mint", shape: "islandMint", art: "fortnightly" },
  { iconTone: "lilac", shape: "islandLilac", art: "quarterly" },
] as const;

export default async function HomePage() {
  const isLocalPreview = allowsLocalPreview();

  if (!isLocalPreview) {
    await requireAllowedUser();
  }

  const locale = await getRequestLocale();
  const copy = dictionaries[locale];
  const database = getDatabase();
  const [content, runState] = await Promise.all([
    createContentCatalog(database).list(),
    createRunManager(database).getHouseholdState(),
  ]);
  const openRun = runState.openRun;

  return (
    <main className="appCanvas">
      <RunChangeRefresh />
      <section className="appSurface" aria-labelledby="home-title">
        <header className="appHeader">
          <Link className="wordmark" href="/" aria-label={copy.doubtfireHome}>
            Doubtfire
          </Link>
          <div className="headerActions">
            <LanguageToggle locale={locale} label={copy.changeLanguage} />
            <div className="accountControl" aria-label={copy.account}>
              {isLocalPreview ? (
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
            <h1 id="home-title">
              {openRun ? copy.cleaningInProgress : copy.greeting}
            </h1>
            <p>
              {openRun
                ? formatPlural(
                    locale,
                    "tasksDone",
                    openRun.tickedCount,
                  )
                : copy.instruction}
            </p>
            {openRun ? (
              <Link className="startButton continueRunLink" href={`/run/${openRun.id}`}>
                <Play aria-hidden="true" fill="currentColor" strokeWidth={2.2} />
                {copy.continueCleaning}
              </Link>
            ) : null}
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
            <span className="coralDot" />
          </div>
        </section>

        <section className="routineSection" aria-labelledby="routine-title">
          <div className="sectionHeading">
            <h2 id="routine-title">
              {openRun ? copy.currentRoutine : copy.routines}
            </h2>
          </div>
          {openRun ? (
            <p className="openRunSummary">{openRun.routine.name}</p>
          ) : (
            <>
              {runState.resumableRun ? (
                <div className="resumableRunIsland">
                  <span className="resumableRunIcon" aria-hidden="true">
                    <CheckCircle2 strokeWidth={2} />
                  </span>
                  <span>
                    <strong>{copy.lastRun}</strong>
                    <small>
                      {formatPlural(
                        locale,
                        "tasksDone",
                        runState.resumableRun.tickedCount,
                      )}
                    </small>
                  </span>
                  <ReopenRunForm
                    action={reopenRunFromHomeAction}
                    reopenLabel={copy.reopenRun}
                    reopeningLabel={copy.reopeningRun}
                    runId={runState.resumableRun.id}
                  />
                </div>
              ) : null}
              <ul
                className="routineList"
                role="radiogroup"
                aria-labelledby="routine-title"
              >
                {content.routines.map((routine, index) => {
                  const style = routineStyles[index % routineStyles.length];

                  return (
                    <li key={routine.id}>
                      <label
                        className={`routineIsland ${style.shape}`}
                      >
                        <input
                          className="srOnly"
                          type="radio"
                          name="routineId"
                          value={routine.id}
                          form="start-run-form"
                          defaultChecked={index === 0}
                        />
                        <span
                          className={`routineIcon ${style.iconTone}`}
                          aria-hidden="true"
                        >
                          <CalendarDays strokeWidth={2} />
                        </span>
                        <span>{routine.name}</span>
                        <span className="islandLinework" aria-hidden="true">
                          <RoutineArt variant={style.art} />
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <StartRunForm
                action={startRunAction}
                disabled={content.routines.length === 0}
                startLabel={copy.startCleaning}
                startingLabel={copy.startingCleaning}
              />
              {content.routines.length === 0 ? (
                <p className="startUnavailable">
                  {copy.noHomeRoutines} <Link href="/settings">{copy.settings}</Link>
                </p>
              ) : null}
            </>
          )}
        </section>

        <nav className="bottomNav" aria-label={copy.primaryNavigation}>
          <Link className="navItem active" href="/" aria-current="page">
            <Home aria-hidden="true" strokeWidth={2.1} />
            <span>{copy.home}</span>
          </Link>
          <Link className="navItem" href="/settings">
            <Settings aria-hidden="true" strokeWidth={2.1} />
            <span>{copy.settings}</span>
          </Link>
        </nav>
      </section>
    </main>
  );
}
