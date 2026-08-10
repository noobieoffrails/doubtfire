"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  initialContentFormState,
  type ContentFormState,
} from "@/content/form-state";

type ContentFormProps = {
  action: (
    state: ContentFormState,
    formData: FormData,
  ) => Promise<ContentFormState>;
  children?: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  submitLabel: string;
  submittingLabel: string;
};

export function ContentForm({
  action,
  children,
  className = "contentForm",
  resetOnSuccess = false,
  submitLabel,
  submittingLabel,
}: ContentFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialContentFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state.status === "success") {
      formRef.current?.reset();
    }
  }, [resetOnSuccess, state.status]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      <div className="formFooter">
        <Button type="submit" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </Button>
        <p
          className={`formMessage ${state.status}`}
          aria-live="polite"
          role={state.status === "error" ? "alert" : undefined}
        >
          {state.message}
        </p>
      </div>
    </form>
  );
}
