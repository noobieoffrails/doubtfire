import { UserButton } from "@clerk/nextjs";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  DoorOpen,
  Home,
  ListChecks,
  Plus,
  Settings,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireAllowedUser } from "@/auth/server";
import { ContentForm } from "@/components/content-form";
import { LanguageToggle } from "@/components/language-toggle";
import { createContentCatalog } from "@/content/content-catalog";
import { getDatabase } from "@/db/client";
import { dictionaries } from "@/i18n/config";
import { getRequestLocale } from "@/i18n/server";
import { allowsLocalPreview } from "@/lib/local-preview";

import {
  archiveRoomAction,
  archiveRoutineAction,
  archiveTaskAction,
  createRoomAction,
  createRoutineAction,
  createTaskAction,
  updateRoomAction,
  updateRoutineAction,
  updateTaskAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const isLocalPreview = allowsLocalPreview();

  if (!isLocalPreview) {
    await requireAllowedUser();
  }

  const locale = await getRequestLocale();
  const copy = dictionaries[locale];
  const content = await createContentCatalog(getDatabase()).list();
  const routineNameById = new Map(
    content.routines.map((routine) => [routine.id, routine.name]),
  );
  const roomNameById = new Map(
    content.rooms.map((room) => [room.id, room.name]),
  );
  const canCreateTask = content.routines.length > 0 && content.rooms.length > 0;

  return (
    <main className="settingsCanvas">
      <section className="settingsSurface" aria-labelledby="settings-title">
        <header className="appHeader settingsHeader">
          <div className="settingsHeaderStart">
            <Link className="iconButton" href="/" aria-label={copy.backHome}>
              <ArrowLeft aria-hidden="true" strokeWidth={2.2} />
            </Link>
            <Link className="wordmark" href="/" aria-label={copy.doubtfireHome}>
              Doubtfire
            </Link>
          </div>
          <div className="headerActions">
            <LanguageToggle locale={locale} label={copy.changeLanguage} />
            <div className="accountControl" aria-label={copy.account}>
              {isLocalPreview ? (
                <CircleUserRound
                  className="accountPlaceholder"
                  aria-hidden="true"
                  strokeWidth={1.9}
                />
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

        <div className="settingsContent">
          <section className="settingsIntro">
            <div>
              <h1 id="settings-title">{copy.manageContent}</h1>
              <p>{copy.manageContentDescription}</p>
            </div>
            <nav className="sectionLinks" aria-label={copy.contentSections}>
              <a href="#routines">{copy.routines}</a>
              <a href="#rooms">{copy.rooms}</a>
              <a href="#tasks">{copy.tasks}</a>
            </nav>
          </section>

          <RoutineManager copy={copy} routines={content.routines} />
          <RoomManager copy={copy} rooms={content.rooms} />
          <TaskManager
            canCreateTask={canCreateTask}
            copy={copy}
            rooms={content.rooms}
            roomNameById={roomNameById}
            routines={content.routines}
            routineNameById={routineNameById}
            tasks={content.tasks}
          />
        </div>

        <nav className="bottomNav" aria-label={copy.primaryNavigation}>
          <Link className="navItem" href="/">
            <Home aria-hidden="true" strokeWidth={2.1} />
            <span>{copy.home}</span>
          </Link>
          <Link className="navItem active" href="/settings" aria-current="page">
            <Settings aria-hidden="true" strokeWidth={2.1} />
            <span>{copy.settings}</span>
          </Link>
        </nav>
      </section>
    </main>
  );
}

type ContentCopy = (typeof dictionaries)[keyof typeof dictionaries];
type Content = Awaited<ReturnType<ReturnType<typeof createContentCatalog>["list"]>>;
type Room = Content["rooms"][number];
type Routine = Content["routines"][number];
type Task = Content["tasks"][number];

function ManagerHeading({
  description,
  icon,
  id,
  title,
  tone,
}: {
  description: string;
  icon: React.ReactNode;
  id: string;
  title: string;
  tone: "sky" | "mint" | "lilac";
}) {
  return (
    <div className="managerHeading">
      <span className={`managerIcon ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <div>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function RoutineManager({ copy, routines }: { copy: ContentCopy; routines: Routine[] }) {
  const routineNameById = new Map(routines.map((routine) => [routine.id, routine.name]));

  return (
    <section className="managerSection" id="routines" aria-labelledby="routines-title">
      <ManagerHeading
        description={copy.routinesDescription}
        icon={<CalendarDays strokeWidth={2} />}
        id="routines-title"
        title={copy.routines}
        tone="sky"
      />
      <details className="addIsland sky" open={routines.length === 0}>
        <summary>
          <Plus aria-hidden="true" />
          {copy.addRoutine}
          <ChevronDown className="summaryChevron" aria-hidden="true" />
        </summary>
        <ContentForm
          action={createRoutineAction}
          resetOnSuccess
          submitLabel={copy.addRoutine}
          submittingLabel={copy.saving}
        >
          <RoutineFields copy={copy} routines={routines} />
        </ContentForm>
      </details>
      {routines.length === 0 ? (
        <p className="emptyState">{copy.noRoutines}</p>
      ) : (
        <ul className="managementList">
          {routines.map((routine) => (
            <li key={routine.id}>
              <details className="contentRow">
                <summary>
                  <span>
                    <strong>{routine.name}</strong>
                    <small>
                      {copy.everyDays.replace("{days}", String(routine.cadenceDays))}
                      {routine.includesRoutineId
                        ? ` · ${copy.includesShort} ${routineNameById.get(routine.includesRoutineId)}`
                        : ""}
                    </small>
                  </span>
                  <ChevronDown className="summaryChevron" aria-hidden="true" />
                </summary>
                <div className="rowEditor">
                  <ContentForm
                    action={updateRoutineAction.bind(null, routine.id)}
                    submitLabel={copy.saveChanges}
                    submittingLabel={copy.saving}
                  >
                    <RoutineFields copy={copy} routine={routine} routines={routines} />
                  </ContentForm>
                  <ArchiveControl
                    action={archiveRoutineAction.bind(null, routine.id)}
                    copy={copy}
                    description={copy.archiveRoutineDescription}
                    label={copy.archiveRoutine}
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RoutineFields({
  copy,
  routine,
  routines,
}: {
  copy: ContentCopy;
  routine?: Routine;
  routines: Routine[];
}) {
  return (
    <div className="fieldGrid">
      <label className="formField">
        <span>{copy.routineName}</span>
        <input name="name" defaultValue={routine?.name} required autoComplete="off" />
      </label>
      <label className="formField">
        <span>{copy.cadenceDays}</span>
        <input
          name="cadenceDays"
          type="number"
          min="1"
          step="1"
          defaultValue={routine?.cadenceDays}
          required
        />
      </label>
      <label className="formField fieldWide">
        <span>{copy.includesRoutine}</span>
        <select name="includesRoutineId" defaultValue={routine?.includesRoutineId ?? ""}>
          <option value="">{copy.noIncludedRoutine}</option>
          {routines
            .filter((candidate) => candidate.id !== routine?.id)
            .map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}

function RoomManager({ copy, rooms }: { copy: ContentCopy; rooms: Room[] }) {
  return (
    <section className="managerSection" id="rooms" aria-labelledby="rooms-title">
      <ManagerHeading
        description={copy.roomsDescription}
        icon={<DoorOpen strokeWidth={2} />}
        id="rooms-title"
        title={copy.rooms}
        tone="mint"
      />
      <details className="addIsland mint" open={rooms.length === 0}>
        <summary>
          <Plus aria-hidden="true" />
          {copy.addRoom}
          <ChevronDown className="summaryChevron" aria-hidden="true" />
        </summary>
        <ContentForm
          action={createRoomAction}
          resetOnSuccess
          submitLabel={copy.addRoom}
          submittingLabel={copy.saving}
        >
          <label className="formField">
            <span>{copy.roomName}</span>
            <input name="name" required autoComplete="off" />
          </label>
        </ContentForm>
      </details>
      {rooms.length === 0 ? (
        <p className="emptyState">{copy.noRooms}</p>
      ) : (
        <ul className="managementList compactList">
          {rooms.map((room) => (
            <li key={room.id}>
              <details className="contentRow">
                <summary>
                  <strong>{room.name}</strong>
                  <ChevronDown className="summaryChevron" aria-hidden="true" />
                </summary>
                <div className="rowEditor">
                  <ContentForm
                    action={updateRoomAction.bind(null, room.id)}
                    submitLabel={copy.saveChanges}
                    submittingLabel={copy.saving}
                  >
                    <label className="formField">
                      <span>{copy.roomName}</span>
                      <input name="name" defaultValue={room.name} required />
                    </label>
                  </ContentForm>
                  <ArchiveControl
                    action={archiveRoomAction.bind(null, room.id)}
                    copy={copy}
                    description={copy.archiveRoomDescription}
                    label={copy.archiveRoom}
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskManager({
  canCreateTask,
  copy,
  rooms,
  roomNameById,
  routines,
  routineNameById,
  tasks,
}: {
  canCreateTask: boolean;
  copy: ContentCopy;
  rooms: Room[];
  roomNameById: Map<string, string>;
  routines: Routine[];
  routineNameById: Map<string, string>;
  tasks: Task[];
}) {
  return (
    <section className="managerSection" id="tasks" aria-labelledby="tasks-title">
      <ManagerHeading
        description={copy.tasksDescription}
        icon={<ListChecks strokeWidth={2} />}
        id="tasks-title"
        title={copy.tasks}
        tone="lilac"
      />
      {canCreateTask ? (
        <details className="addIsland lilac" open={tasks.length === 0}>
          <summary>
            <Plus aria-hidden="true" />
            {copy.addTask}
            <ChevronDown className="summaryChevron" aria-hidden="true" />
          </summary>
          <ContentForm
            action={createTaskAction}
            resetOnSuccess
            submitLabel={copy.addTask}
            submittingLabel={copy.saving}
          >
            <TaskFields copy={copy} rooms={rooms} routines={routines} />
          </ContentForm>
        </details>
      ) : (
        <p className="emptyState prerequisites">{copy.taskPrerequisites}</p>
      )}
      {tasks.length === 0 ? (
        <p className="emptyState">{copy.noTasks}</p>
      ) : (
        <ul className="managementList taskList">
          {tasks.map((task) => (
            <li key={task.id}>
              <details className="contentRow taskRow">
                <summary>
                  <span>
                    <strong>{task.text}</strong>
                    <small>
                      {routineNameById.get(task.routineId)} · {roomNameById.get(task.roomId)}
                      {task.groupLabel ? ` · ${task.groupLabel}` : ""}
                    </small>
                  </span>
                  <ChevronDown className="summaryChevron" aria-hidden="true" />
                </summary>
                <div className="rowEditor">
                  <ContentForm
                    action={updateTaskAction.bind(null, task.id)}
                    submitLabel={copy.saveChanges}
                    submittingLabel={copy.saving}
                  >
                    <TaskFields copy={copy} rooms={rooms} routines={routines} task={task} />
                  </ContentForm>
                  <ArchiveControl
                    action={archiveTaskAction.bind(null, task.id)}
                    copy={copy}
                    description={copy.archiveTaskDescription}
                    label={copy.archiveTask}
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskFields({
  copy,
  rooms,
  routines,
  task,
}: {
  copy: ContentCopy;
  rooms: Room[];
  routines: Routine[];
  task?: Task;
}) {
  return (
    <div className="fieldGrid taskFields">
      <label className="formField fieldWide">
        <span>{copy.taskText}</span>
        <input name="text" defaultValue={task?.text} required autoComplete="off" />
      </label>
      <label className="formField">
        <span>{copy.routine}</span>
        <select name="routineId" defaultValue={task?.routineId} required>
          {routines.map((routine) => (
            <option key={routine.id} value={routine.id}>
              {routine.name}
            </option>
          ))}
        </select>
      </label>
      <label className="formField">
        <span>{copy.room}</span>
        <select name="roomId" defaultValue={task?.roomId} required>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </label>
      <label className="formField fieldWide">
        <span>{copy.groupOptional}</span>
        <input name="groupLabel" defaultValue={task?.groupLabel ?? ""} autoComplete="off" />
      </label>
      <label className="formField fieldWide">
        <span>{copy.noteOptional}</span>
        <textarea name="note" defaultValue={task?.note ?? ""} rows={3} />
      </label>
    </div>
  );
}

function ArchiveControl({
  action,
  copy,
  description,
  label,
}: {
  action: (
    state: import("@/content/form-state").ContentFormState,
    formData: FormData,
  ) => Promise<import("@/content/form-state").ContentFormState>;
  copy: ContentCopy;
  description: string;
  label: string;
}) {
  return (
    <details className="archiveDisclosure">
      <summary>
        <Archive aria-hidden="true" />
        {label}
      </summary>
      <p>{description}</p>
      <ContentForm
        action={action}
        className="archiveForm"
        submitLabel={copy.confirmArchive}
        submittingLabel={copy.archiving}
      />
    </details>
  );
}
