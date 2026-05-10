/**
 * @file     identity.ts
 * @location src/prelude/identity.ts
 * @brief    The identity function: returns its argument unchanged.
 */

/**
 * Returns its argument unchanged.
 *
 * Useful as a default callback, a no-op transformer in conditional pipelines,
 * and a placeholder when a function is required but no work needs to be done.
 *
 * **Type shape:**
 *
 * `identity : Value -> Value`
 *
 * @example
 * identity(5) // 5
 * identity("hello") // "hello"
 *
 * // As a default no-op transformer
 * const maybeShout = (loud: boolean) =>
 *   loud ? (x: string) => x.toUpperCase() : identity
 *
 * maybeShout(true)("hi")  // "HI"
 * maybeShout(false)("hi") // "hi"
 *
 * // Filtering falsy values from an array
 * [1, 0, 2, null, 3].filter(identity) // [1, 2, 3]
 */
export const identity = <Value>(x: Value): Value => x
