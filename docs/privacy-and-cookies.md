# Privacy and cookies

This is the current technical assessment for Doubtfire. It is not legal advice.

## Current storage

Doubtfire uses these cookie groups:

- Clerk authentication cookies keep the predefined user signed in and protect the session. Clerk requires them for authentication and does not use them for cross-site tracking.
- `doubtfire-language` stores the interface language that the user selected. It lasts for one year.

Doubtfire has no analytics, advertising, or behavior-tracking cookies. It does not load an analytics SDK.

The current assessment is that these cookies are necessary for the service that the user requested. Doubtfire therefore gives cookie information but does not show a consent banner. Finnish Transport and Communications Agency guidance says that essential cookies do not require consent. Clerk states that its authentication cookies are required for Clerk to operate.

Sources:

- [Traficom guidance on web cookies](https://www.traficom.fi/sites/default/files/media/file/Guidance_on_the_use_of_web_cookies_for_the_service_providers.pdf)
- [Clerk cookie documentation](https://clerk.com/docs/guides/how-clerk-works/cookies)

## Change rule

Review this assessment before you add browser storage, third-party scripts, analytics, error replay, advertising, or tracking. If a new purpose is not necessary for the requested service, block that storage until the user gives valid consent. Update the public `/privacy` page at the same time.
