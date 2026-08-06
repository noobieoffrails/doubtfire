import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { getLocale } from "@/i18n/config";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: {
    default: "Doubtfire",
    template: "%s · Doubtfire",
  },
  description: "A calm shared place for household cleaning routines.",
  applicationName: "Doubtfire",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Doubtfire",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  colorScheme: "light",
  themeColor: "#f7fbff",
  viewportFit: "cover",
};

const designContract = `
THESIS: Familiar household controls become memorable through broad color islands; refuse a neutral card dashboard.
OWN-WORLD: White and ice surfaces, deep navy type, cobalt actions, and large sky, mint, and lilac fields with asymmetric soft corners.
STORY: The household sees a calm welcome, understands that Routines are ready, and starts cleaning when Run behavior is available.
FIRST VIEWPORT: Compact header; large greeting and cobalt action at upper left; home-care still life at upper right; three broad Routine fields; fixed bottom navigation.
FORM: Color Islands, third composition in the category-standard world; seed fc1af77b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
`.trim();

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = getLocale((await cookies()).get("doubtfire-language")?.value);
  const allowsLocalPreview =
    process.env.NODE_ENV !== "production" &&
    process.env.DOUBTFIRE_ALLOW_UNAUTHENTICATED_PREVIEW === "1";

  return (
    <html lang={locale}>
      <body className={manrope.variable}>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.currentScript?.before(document.createComment(${JSON.stringify(designContract)}));`,
          }}
        />
        {allowsLocalPreview ? children : <ClerkProvider>{children}</ClerkProvider>}
      </body>
    </html>
  );
}
