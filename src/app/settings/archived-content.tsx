import { ArchiveRestore } from "lucide-react";

import { ContentForm } from "@/components/content-form";
import { createContentCatalog } from "@/content/content-catalog";
import { dictionaries } from "@/i18n/config";

import {
  restoreRoomAction,
  restoreRoutineAction,
  restoreTaskAction,
} from "./actions";

type Content = Awaited<
  ReturnType<ReturnType<typeof createContentCatalog>["list"]>
>;
type ContentCopy = (typeof dictionaries)[keyof typeof dictionaries];

function restoreLabel(copy: ContentCopy, name: string): string {
  return copy.restoreNamed.replace("{name}", name);
}

function ArchivedGroup({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="archivedGroup">
      <h3>{title}</h3>
      <ul className="archivedList">{children}</ul>
    </section>
  );
}

function RestoreForm({
  action,
  copy,
  name,
}: {
  action: (
    state: import("@/content/form-state").ContentFormState,
    formData: FormData,
  ) => Promise<import("@/content/form-state").ContentFormState>;
  copy: ContentCopy;
  name: string;
}) {
  return (
    <ContentForm
      action={action}
      className="restoreForm"
      submitLabel={restoreLabel(copy, name)}
      submittingLabel={copy.restoring}
    />
  );
}

export function ArchivedContent({
  content,
  copy,
}: {
  content: Content;
  copy: ContentCopy;
}) {
  const archivedRooms = content.rooms.filter((room) => room.archivedAt);
  const archivedRoutines = content.routines.filter((routine) => routine.archivedAt);
  const archivedTasks = content.tasks.filter((task) => task.archivedAt);
  const hasArchivedContent =
    archivedRooms.length > 0 ||
    archivedRoutines.length > 0 ||
    archivedTasks.length > 0;
  const roomById = new Map(content.rooms.map((room) => [room.id, room]));
  const routineById = new Map(
    content.routines.map((routine) => [routine.id, routine]),
  );

  return (
    <section
      className="managerSection archivedManager"
      id="archived"
      aria-labelledby="archived-title"
    >
      <div className="managerHeading">
        <span className="managerIcon neutral" aria-hidden="true">
          <ArchiveRestore strokeWidth={2} />
        </span>
        <div>
          <h2 id="archived-title">{copy.archivedContent}</h2>
          <p>{copy.archivedContentDescription}</p>
        </div>
      </div>
      {!hasArchivedContent ? (
        <p className="emptyState">{copy.noArchivedContent}</p>
      ) : (
        <div className="archivedGroups">
          {archivedRoutines.length > 0 ? (
            <ArchivedGroup title={copy.archivedRoutines}>
              {archivedRoutines.map((routine) => (
                <li className="archivedRow" key={routine.id}>
                  <strong>{routine.name}</strong>
                  <RestoreForm
                    action={restoreRoutineAction.bind(null, routine.id)}
                    copy={copy}
                    name={routine.name}
                  />
                </li>
              ))}
            </ArchivedGroup>
          ) : null}
          {archivedRooms.length > 0 ? (
            <ArchivedGroup title={copy.archivedRooms}>
              {archivedRooms.map((room) => (
                <li className="archivedRow" key={room.id}>
                  <strong>{room.name}</strong>
                  <RestoreForm
                    action={restoreRoomAction.bind(null, room.id)}
                    copy={copy}
                    name={room.name}
                  />
                </li>
              ))}
            </ArchivedGroup>
          ) : null}
          {archivedTasks.length > 0 ? (
            <ArchivedGroup title={copy.archivedTasks}>
              {archivedTasks.map((task) => {
                const room = roomById.get(task.roomId);
                const routine = routineById.get(task.routineId);
                const canRestore =
                  room?.archivedAt === null && routine?.archivedAt === null;

                return (
                  <li className="archivedRow" key={task.id}>
                    <span>
                      <strong>{task.text}</strong>
                      <small>
                        {routine?.name} · {room?.name}
                      </small>
                    </span>
                    {canRestore ? (
                      <RestoreForm
                        action={restoreTaskAction.bind(null, task.id)}
                        copy={copy}
                        name={task.text}
                      />
                    ) : (
                      <p className="restorePrerequisite">
                        {copy.contentRestoreBlocked}
                      </p>
                    )}
                  </li>
                );
              })}
            </ArchivedGroup>
          ) : null}
        </div>
      )}
    </section>
  );
}
