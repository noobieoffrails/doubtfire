type RoutineArtProps = {
  variant: "weekly" | "fortnightly" | "quarterly";
};

export function RoutineArt({ variant }: RoutineArtProps) {
  if (variant === "weekly") {
    return (
      <svg viewBox="0 0 120 72" role="presentation">
        <path d="M22 62h78M48 62V43h25v19M52 43c-9-8-10-17-7-27 10 4 17 12 18 24M68 43c2-12 10-20 22-24 1 12-5 22-17 28" />
        <path d="M35 62V51h10M83 62V48h12v14" />
      </svg>
    );
  }

  if (variant === "fortnightly") {
    return (
      <svg viewBox="0 0 120 72" role="presentation">
        <path d="M18 56h84l-8 11H26l-8-11ZM33 56V38h18v18M66 56V31h17v25" />
        <path d="M36 38v-9h12v9M70 31V20h9v11M30 29h24M65 20h19M90 56V41h8v15" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 72" role="presentation">
      <path d="M14 35h55v30H14zM10 27h63v9H10zM24 45h34M78 65V47h23v18" />
      <path d="M83 47c-8-7-9-15-6-24 9 4 15 11 16 21M94 47c2-10 9-17 19-20 0 11-5 19-15 23" />
    </svg>
  );
}
