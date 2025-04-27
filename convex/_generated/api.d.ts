/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as code from "../code.js";
import type * as codeTemplates from "../codeTemplates.js";
import type * as crons from "../crons.js";
import type * as execution from "../execution.js";
import type * as http from "../http.js";
import type * as languageMap from "../languageMap.js";
import type * as piston from "../piston.js";
import type * as presence from "../presence.js";
import type * as rooms from "../rooms.js";
import type * as scheduled from "../scheduled.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  code: typeof code;
  codeTemplates: typeof codeTemplates;
  crons: typeof crons;
  execution: typeof execution;
  http: typeof http;
  languageMap: typeof languageMap;
  piston: typeof piston;
  presence: typeof presence;
  rooms: typeof rooms;
  scheduled: typeof scheduled;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
