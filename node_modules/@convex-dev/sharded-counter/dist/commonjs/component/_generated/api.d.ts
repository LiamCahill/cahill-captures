/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: import("convex/server").AnyApi;
export const internal: import("convex/server").AnyApi;
export const components: {
    [x: string]: import("../../../node_modules/convex/dist/esm-types/server/components").AnyComponentReference;
};
//# sourceMappingURL=api.d.ts.map