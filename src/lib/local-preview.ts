export function allowsLocalPreview(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DOUBTFIRE_ALLOW_UNAUTHENTICATED_PREVIEW === "1"
  );
}
