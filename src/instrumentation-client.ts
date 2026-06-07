import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://364ab6bf9750abaf404dd33dab2a9493@o4511524727619584.ingest.us.sentry.io/4511524732731392",
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.5,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
