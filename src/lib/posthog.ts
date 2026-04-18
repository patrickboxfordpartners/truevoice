import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;
  posthog.init("phc_S9m5GZ2t6EXZ4DAO4zbMHycBcWiJHefj5KR7SbJjy8l", {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export { posthog };
