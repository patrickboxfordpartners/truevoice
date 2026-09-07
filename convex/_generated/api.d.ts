/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_autopilot from "../actions/autopilot.js";
import type * as actions_crossReferenceResume from "../actions/crossReferenceResume.js";
import type * as actions_enrichCandidate from "../actions/enrichCandidate.js";
import type * as actions_executeAutopilotDecision from "../actions/executeAutopilotDecision.js";
import type * as actions_extractActionItems from "../actions/extractActionItems.js";
import type * as actions_generateInterviewSummary from "../actions/generateInterviewSummary.js";
import type * as actions_generateQuestionAudio from "../actions/generateQuestionAudio.js";
import type * as actions_intelligencePipeline from "../actions/intelligencePipeline.js";
import type * as actions_joanChat from "../actions/joanChat.js";
import type * as actions_parseResumeEmail from "../actions/parseResumeEmail.js";
import type * as actions_sendDeadlineReminders from "../actions/sendDeadlineReminders.js";
import type * as actions_sendStageChangeEmail from "../actions/sendStageChangeEmail.js";
import type * as actions_slackNotify from "../actions/slackNotify.js";
import type * as clearDemoData from "../clearDemoData.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_emailService from "../lib/emailService.js";
import type * as lib_emailTemplates from "../lib/emailTemplates.js";
import type * as mutations from "../mutations.js";
import type * as peerReviews from "../peerReviews.js";
import type * as queries from "../queries.js";
import type * as seedData from "../seedData.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/autopilot": typeof actions_autopilot;
  "actions/crossReferenceResume": typeof actions_crossReferenceResume;
  "actions/enrichCandidate": typeof actions_enrichCandidate;
  "actions/executeAutopilotDecision": typeof actions_executeAutopilotDecision;
  "actions/extractActionItems": typeof actions_extractActionItems;
  "actions/generateInterviewSummary": typeof actions_generateInterviewSummary;
  "actions/generateQuestionAudio": typeof actions_generateQuestionAudio;
  "actions/intelligencePipeline": typeof actions_intelligencePipeline;
  "actions/joanChat": typeof actions_joanChat;
  "actions/parseResumeEmail": typeof actions_parseResumeEmail;
  "actions/sendDeadlineReminders": typeof actions_sendDeadlineReminders;
  "actions/sendStageChangeEmail": typeof actions_sendStageChangeEmail;
  "actions/slackNotify": typeof actions_slackNotify;
  clearDemoData: typeof clearDemoData;
  crons: typeof crons;
  http: typeof http;
  "lib/emailService": typeof lib_emailService;
  "lib/emailTemplates": typeof lib_emailTemplates;
  mutations: typeof mutations;
  peerReviews: typeof peerReviews;
  queries: typeof queries;
  seedData: typeof seedData;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
