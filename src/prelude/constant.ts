/**
 * @file     constant.ts
 * @location src/prelude/constant.ts
 * @brief    The constant function: ignores its arguments and always returns the same value.
 */

/**
 * Builds a function that ignores its arguments and always returns the
 * same value.
 *
 * Useful as a default callback, in higher order code where a function
 * is required but the input doesn't matter, or for filling arrays with
 * a fixed value.
 *
 * **Type shape:**
 *
 * `constant : Value -> (..._: unknown[]) -> Value`
 *
 * @example
 * const five = constant(5)
 * five()           // 5
 * five("ignored")  // 5
 * five(1, 2, 3)    // 5
 *
 * // Filling an array with a fixed value
 * [1, 2, 3, 4].map(constant(0)) // [0, 0, 0, 0]
 *
 * // Always-true / always-false predicates
 * const alwaysTrue = constant(true)
 * [1, 2, 3].filter(alwaysTrue) // [1, 2, 3]
 *
 * // Replacing a Promise's resolved value
 * fetch("/api").then(constant("done")) // resolves to "done" regardless of response
 */
export const constant = <Value>(value: Value) =>
  (..._: ReadonlyArray<unknown>): Value => value
