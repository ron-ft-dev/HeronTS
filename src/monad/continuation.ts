/**
 * @file     continuation.ts
 * @location src/monad/continuation.ts
 * @brief    The Continuation monad for CPS-style programming.
 */

import type { Unary } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A `Continuation<Final, Current>` is a computation that currently holds a
 * `Current` value and is waiting for instructions on what to do with it.
 *
 * You provide those instructions as a callback. The callback transforms
 * the `Current` into a `Final`. The continuation runs the callback and
 * returns the `Final`.
 *
 * Making "what happens next" an explicit, first-class function is the
 * foundation of CPS-style programming (Continuation-Passing Style). It
 * gives you `callWithCurrentContinuation` for free, from which you can
 * derive early returns, exceptions, generators, and coroutines.
 *
 * **Type shape:**
 *
 * `Continuation<Final, Current> = (callback: Current -> Final) -> Final`
 *
 * @example
 * import { Continuation } from 'heron-ts/monad/continuation'
 *
 * const five: Continuation<string, number> = (callback) => callback(5)
 *
 * five((current) => `The number is ${current}`) // "The number is 5"
 * five((current) => String(current * 2))         // "10"
 * five((current) => current > 0)                 // true
 */
export type Continuation<Final, Current> =
  (callback: Unary<Current, Final>) => Final

/**
 * The escape hatch provided by `callWithCurrentContinuation`.
 *
 * Invoking `escape(value)` abandons the current computation and resumes
 * from the call site of `callWithCurrentContinuation`. The `Discarded`
 * type parameter represents the return type of the escape function itself
 * — it is never used because calling `escape` never returns to its caller.
 *
 * **Type shape:**
 *
 * `Escape<Final, Current> = <Discarded>(value: Current) -> Continuation<Final, Discarded>`
 */
export type Escape<Final, Current> =
  <Discarded>(value: Current) => Continuation<Final, Discarded>

/**
 * A computation that has access to an `Escape` hatch and produces a
 * `Continuation`. Passed as the argument to `callWithCurrentContinuation`.
 *
 * **Type shape:**
 *
 * `WithEscape<Final, Current> = (escape: Escape<Final, Current>) -> Continuation<Final, Current>`
 */
export type WithEscape<Final, Current> =
  (escape: Escape<Final, Current>) => Continuation<Final, Current>

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into a `Continuation`.
 *
 * The resulting continuation does no work — when given a callback, it
 * immediately hands the value over.
 *
 * **Type shape:**
 *
 * `of : Current -> Continuation<Final, Current>`
 *
 * @example
 * import { Continuation } from 'heron-ts/monad/continuation'
 *
 * const five = Continuation.of<string, number>(5)
 *
 * five((current) => `Got ${current}`) // "Got 5"
 */
const of = <Final, Current>(
  value: Current,
): Continuation<Final, Current> =>
  (callback) => callback(value)

/**
 * Executes a `Continuation` by supplying its final callback.
 *
 * This is the exit point from continuation-land. You provide the final
 * "what to do with the value" function, and the entire chain executes,
 * producing a plain `Final`.
 *
 * Curried so that the callback can be pre-baked and reused across
 * multiple continuations, and so that `run` slots cleanly into `pipe`.
 *
 * **Type shape:**
 *
 * `run : (Current -> Final) -> Continuation<Final, Current> -> Final`
 *
 * @example
 * import { Continuation } from 'heron-ts/monad/continuation'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const result = pipe(
 *   Continuation.of<string, number>(5),
 *   Continuation.run((current: number) => `Got ${current}`),
 * )
 * // "Got 5"
 *
 * // Pre-baking the callback for reuse
 * const extract = Continuation.run((current: number) => current)
 * extract(Continuation.of(1)) // 1
 * extract(Continuation.of(2)) // 2
 */
const run = <Final, Current>(
  callback: Unary<Current, Final>,
) =>
  (continuation: Continuation<Final, Current>): Final =>
    continuation(callback)

/**
 * Transforms the value inside a `Continuation` without changing `Final`.
 *
 * Does not execute immediately. Builds a new continuation that, when
 * eventually run, will apply the transform mid-flight before handing
 * the result to the final callback.
 *
 * **Type shape:**
 *
 * `map : (Current -> Mapped) -> Continuation<Final, Current> -> Continuation<Final, Mapped>`
 *
 * @example
 * import { Continuation } from 'heron-ts/monad/continuation'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const result = pipe(
 *   Continuation.of<string, number>(5),
 *   Continuation.map((current: number) => current * 2),
 *   Continuation.map((current: number) => `Result: ${current}`),
 *   Continuation.run((current: string) => current.toUpperCase()),
 * )
 * // "RESULT: 10"
 */
const map = <Final, Current, Mapped>(
  transform: Unary<Current, Mapped>,
) =>
  (continuation: Continuation<Final, Current>): Continuation<Final, Mapped> =>
    (callback) =>
      continuation((current) => callback(transform(current)))

/**
 * Sequences two `Continuation`s: feeds the first's value into `next`
 * to produce a second continuation, then runs that with the final callback.
 *
 * Use `chain` when the transformation function itself returns a
 * `Continuation`. If it returns a plain value, use `map` instead.
 *
 * **Type shape:**
 *
 * `chain : (Current -> Continuation<Final, Next>) -> Continuation<Final, Current> -> Continuation<Final, Next>`
 *
 * @example
 * import { Continuation } from 'heron-ts/monad/continuation'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const fetchUser = (id: number): Continuation<string, { name: string }> =>
 *   (callback) => callback({ name: 'Alice' })
 *
 * const greet = (user: { name: string }): Continuation<string, string> =>
 *   (callback) => callback(`Hello, ${user.name}!`)
 *
 * const result = pipe(
 *   fetchUser(42),
 *   Continuation.chain(greet),
 *   Continuation.run((current: string) => current),
 * )
 * // "Hello, Alice!"
 */
const chain = <Final, Current, Next>(
  next: Unary<Current, Continuation<Final, Next>>,
) =>
  (continuation: Continuation<Final, Current>): Continuation<Final, Next> =>
    (callback) =>
      continuation((current) => next(current)(callback))

/**
 * Applies a `Continuation`-wrapped function to a `Continuation`-wrapped
 * value.
 *
 * Useful when you have a continuation that produces a function, and
 * another that produces a value, and you want to apply one to the other.
 *
 * **Type shape:**
 *
 * `apply : Continuation<Final, (Current -> Mapped)> -> Continuation<Final, Current> -> Continuation<Final, Mapped>`
 *
 * @example
 * import { Continuation } from 'heron-ts/monad/continuation'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const transform = Continuation.of<string, (n: number) => number>(
 *   (n) => n * 2,
 * )
 *
 * const result = pipe(
 *   Continuation.of<string, number>(5),
 *   Continuation.apply(transform),
 *   Continuation.run((current: number) => `Result: ${current}`),
 * )
 * // "Result: 10"
 */
const apply = <Final, Current, Mapped>(
  continuationOfFunction: Continuation<Final, Unary<Current, Mapped>>,
) =>
  (continuation: Continuation<Final, Current>): Continuation<Final, Mapped> =>
    (callback) =>
      continuationOfFunction((transform) =>
        continuation((current) => callback(transform(current)))
      )

/**
 * Reifies the current continuation as a first-class `escape` function.
 *
 * Calling `escape(value)` inside the body abandons the rest of the
 * computation and resumes from the `callWithCurrentContinuation` call
 * site with `value` as the result. This is the foundation for early
 * returns, exceptions, and non-local control flow.
 *
 * The name comes from the original Scheme function `call-with-current-continuation`,
 * commonly abbreviated `call/cc` in literature. We use the full name
 * here to follow the library's "no abbreviations" convention.
 *
 * **Type shape:**
 *
 * `callWithCurrentContinuation : WithEscape<Final, Current> -> Continuation<Final, Current>`
 *
 * @example
 * import { Continuation } from 'heron-ts/monad/continuation'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // Early return: find the first negative number in a list
 * const findFirstNegative = (numbers: ReadonlyArray<number>): Continuation<number, number> =>
 *   Continuation.callWithCurrentContinuation((escape) => {
 *     for (const number of numbers) {
 *       if (number < 0) return escape(number)
 *     }
 *     return Continuation.of(0)
 *   })
 *
 * pipe(
 *   findFirstNegative([1, 2, -5, 3, -7]),
 *   Continuation.run((current: number) => current),
 * )
 * // -5 — stopped at the first negative, never visited 3 or -7
 */
const callWithCurrentContinuation = <Final, Current>(
  body: WithEscape<Final, Current>,
): Continuation<Final, Current> =>
  (callback) =>
    body(
      <Discarded>(value: Current): Continuation<Final, Discarded> =>
        (_discardedCallback) => callback(value)
    )(callback)

/**
 * Delimits a `Continuation`: runs `inner` to its final value using the
 * identity callback, then re-wraps that value in a fresh `Continuation`.
 *
 * Any escape attempts inside `inner` are bounded by this call — they
 * cannot jump past the `reset`. Use `reset` to limit how far an escape
 * can travel up the call stack.
 *
 * **Type shape:**
 *
 * `reset : Continuation<Current, Current> -> Continuation<Final, Current>`
 *
 * @example
 * import { Continuation } from 'heron-ts/monad/continuation'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const bounded = Continuation.reset(
 *   Continuation.callWithCurrentContinuation((escape) => {
 *     return escape(42)
 *     // escape cannot jump past the reset boundary above
 *   }),
 * )
 *
 * pipe(
 *   bounded,
 *   Continuation.run((current: number) => `Bounded result: ${current}`),
 * )
 * // "Bounded result: 42"
 */
const reset = <Final, Current>(
  inner: Continuation<Current, Current>,
): Continuation<Final, Current> =>
  (callback) => callback(inner((current) => current))

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Continuation` monad for CPS-style programming.
 *
 * A `Continuation<Final, Current>` is a computation that holds a `Current`
 * value and is waiting for a callback that will turn it into a `Final`.
 * Making "what happens next" an explicit function gives you first-class
 * control flow: early returns, exceptions, generators, and coroutines all
 * fall out of a single primitive — `callWithCurrentContinuation`.
 *
 * @example
 * import { Continuation } from 'heron-ts/monad/continuation'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const result = pipe(
 *   Continuation.of<string, number>(5),
 *   Continuation.map((current: number) => current * 2),
 *   Continuation.map((current: number) => `Result: ${current}`),
 *   Continuation.run((current: string) => current.toUpperCase()),
 * )
 * // "RESULT: 10"
 */
export const Continuation = {
  of,
  run,
  map,
  chain,
  apply,
  callWithCurrentContinuation,
  reset,
} as const
