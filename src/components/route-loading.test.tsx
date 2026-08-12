import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/components/locale-provider";

import { RouteLoading } from "./route-loading";

describe("RouteLoading", () => {
  it("uses localized status text for the Run shell", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider locale="fi">
        <RouteLoading variant="run" />
      </LocaleProvider>,
    );

    expect(html).toContain("Ladataan…");
    expect(html).toContain("runLoadingContent");
  });

  it("uses the Settings content shape", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider locale="en">
        <RouteLoading variant="settings" />
      </LocaleProvider>,
    );

    expect(html).toContain("Loading…");
    expect(html).toContain("settingsLoadingContent");
  });
});
