/**
 * @file     pipe.ts
 * @location src/prelude/pipe.ts
 * @brief    Threads a value through a series of functions left-to-right.
 */

/**
 * Threads a value through a series of functions, applying each one in
 * order from left to right.
 *
 * Equivalent to `fnN(...(fn2(fn1(value)))...)` but reads top-to-bottom
 * instead of inside-out, which makes long transformation chains far
 * easier to follow.
 *
 * Supports up to 8 transformation steps. For longer pipelines, extract
 * sub-pipelines into named functions using `flow`, or split into
 * multiple `pipe` calls.
 *
 * **Type shape:**
 *
 * `pipe : (Value, Value -> A, A -> B, ..., Y -> Z) -> Z`
 *
 * @example
 * pipe(
 *   5,
 *   (n) => n * 2,
 *   (n) => `Got ${n}`,
 * )
 * // "Got 10"
 *
 * pipe(
 *   Continuation.of<string, number>(5),
 *   Continuation.map((n: number) => n * 2),
 *   Continuation.run((n: number) => `Result: ${n}`),
 * )
 * // "Result: 10"
 */

// 1 argument — returns the value unchanged
export function pipe<A>(value: A): A

// 2 arguments
export function pipe<A, B>(
  value: A,
  ab: (a: A) => B,
): B

// 3 arguments
export function pipe<A, B, C>(
  value: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
): C

// 4 arguments
export function pipe<A, B, C, D>(
  value: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
): D

// 5 arguments
export function pipe<A, B, C, D, E>(
  value: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
): E

// 6 arguments
export function pipe<A, B, C, D, E, F>(
  value: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
): F

// 7 arguments
export function pipe<A, B, C, D, E, F, G>(
  value: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
): G

// 8 arguments
export function pipe<A, B, C, D, E, F, G, H>(
  value: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
): H

// 9 arguments
export function pipe<A, B, C, D, E, F, G, H, I>(
  value: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
): I

// Implementation signature — only seen by the implementation, not by callers
export function pipe(
  value: unknown,
  ...fns: ReadonlyArray<(input: unknown) => unknown>
): unknown {
  return fns.reduce((accumulator, fn) => fn(accumulator), value)
}
