"use client";

import { Play, RotateCcw } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  initialContentFormState,
  type ContentFormState,
} from "@/content/form-state";

type HomeRunAction = (
  state: ContentFormState,
  formData: FormData,
) => Promise<ContentFormState>;

function ActionError({ state }: { state: ContentFormState }) {
  return state.status === "error" ? (
    <p className="formMessage error" role="alert">
      {state.message}
    </p>
  ) : null;
}

export function StartRunForm({
  action,
  disabled,
  startLabel,
  startingLabel,
}: {
  action: HomeRunAction;
  disabled: boolean;
  startLabel: string;
  startingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialContentFormState,
  );

  return (
    <form className="startRunForm" id="start-run-form" action={formAction}>
      <Button className="startButton" type="submit" disabled={disabled || pending}>
        <Play aria-hidden="true" fill="currentColor" strokeWidth={2.2} />
        {pending ? startingLabel : startLabel}
      </Button>
      <ActionError state={state} />
    </form>
  );
}

export function ReopenRunForm({
  action,
  reopenLabel,
  reopeningLabel,
  runId,
}: {
  action: HomeRunAction;
  reopenLabel: string;
  reopeningLabel: string;
  runId: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialContentFormState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="runId" value={runId} />
      <button type="submit" disabled={pending}>
        <RotateCcw aria-hidden="true" />
        {pending ? reopeningLabel : reopenLabel}
      </button>
      <ActionError state={state} />
    </form>
  );
}
