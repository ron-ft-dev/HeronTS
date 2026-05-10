/**
 * @file     flow.ts
 * @location src/prelude/flow.ts
 * @brief    Composes functions left-to-right into a single function.
 */

/**
 * Composes a series of functions left-to-right into a single function.
 *
 * Unlike `pipe`, `flow` does not take an initial value. It returns a
 * function that, when called with a value, threads it through the
 * composed steps.
 *
 * Useful for defining reusable transformation pipelines that will be
 * applied to many different values.
 *
 * Supports up to 8 composed functions. For longer compositions, split
 * into multiple `flow` calls or extract sub-pipelines into named helpers.
 *
 * **Type shape:**
 *
 * `flow : (Value -> A, A -> B, ..., Y -> Z) -> (Value -> Z)`
 *
 * @example
 * const formatDouble = flow(
 *   (n: number) => n * 2,
 *   (n: number) => `Got ${n}`,
 * )
 *
 * formatDouble(5)  // "Got 10"
 * formatDouble(7)  // "Got 14"
 *
 * // Building reusable monadic pipelines
 * const formatNumber = flow(
 *   Continuation.map((n: number) => n * 2),
 *   Continuation.run((n: number) => `Result: ${n}`),
 * )
 *
 * formatNumber(Continuation.of<string, number>(5)) // "Result: 10"
 */
export function flow<A, B>(
  ab: (a: A) => B,
): (a: A) => B

export function flow<A, B, C>(
  ab: (a: A) => B,
  bc: (b: B) => C,
): (a: A) => C

export function flow<A, B, C, D>(
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
): (a: A) => D

export function flow<A, B, C, D, E>(
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
): (a: A) => E

export function flow<A, B, C, D, E, F>(
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
): (a: A) => F

export function flow<A, B, C, D, E, F, G>(
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
): (a: A) => G

export function flow<A, B, C, D, E, F, G, H>(
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
): (a: A) => H

export function flow<A, B, C, D, E, F, G, H, I>(
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
): (a: A) => I

export function flow(
  ...fns: ReadonlyArray<(input: unknown) => unknown>
): (initialValue: unknown) => unknown {
  return (initialValue) =>
    fns.reduce((accumulator, fn) => fn(accumulator), initialValue)
}
