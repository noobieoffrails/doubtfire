export type ContentFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialContentFormState: ContentFormState = {
  status: "idle",
  message: "",
};
