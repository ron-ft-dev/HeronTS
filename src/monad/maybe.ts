/**
 * @file     maybe.ts
 * @location src/monad/maybe.ts
 * @brief    The Maybe monad for explicit, composable optional values.
 */

import type { Unary, Binary, Ternary, Nullable, Lazy, Predicate } from '../prelude/types'
import { Result } from './result'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Represents the presence of a value.
 *
 * **Type shape:**
 *
 * `Some<Value> = { _tag: 'Some', value: Value }`
 */
export type Some<Value> = {
  readonly _tag: 'Some'
  readonly value: Value
}

/**
 * Represents the absence of a value.
 *
 * **Type shape:**
 *
 * `None = { _tag: 'None' }`
 */
export type None = {
  readonly _tag: 'None'
}

/**
 * A `Maybe<Value>` is a value that might or might not be present.
 *
 * It is either `Some<Value>` (a value exists) or `None` (no value).
 * Unlike `Nullable<Value>`, a `Maybe` is explicit about absence — there
 * is no ambiguity between "no value" and "the value happens to be null."
 *
 * Use `Maybe` when:
 * - A computation might not produce a value.
 * - You want to chain optional operations without nested null checks.
 * - You want the type system to force you to handle the absent case.
 *
 * For interop with native JavaScript nullability, use `Maybe.fromNullable`
 * to convert a `Nullable<Value>` into a `Maybe<Value>`.
 *
 * **Type shape:**
 *
 * `Maybe<Value> = Some<Value> | None`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * const found: Maybe<number> = Maybe.some(5)
 * const missing: Maybe<number> = Maybe.none
 *
 * Maybe.run({
 *   onSome: (value) => `Found: ${value}`,
 *   onNone: () => 'Nothing here',
 * })(found)
 * // "Found: 5"
 *
 * Maybe.run({
 *   onSome: (value) => `Found: ${value}`,
 *   onNone: () => 'Nothing here',
 * })(missing)
 * // "Nothing here"
 */
export type Maybe<Value> = Some<Value> | None

/**
 * The two handlers required to eliminate a `Maybe<Value>`. Passed to
 * `Maybe.run` and `Maybe.fold`.
 *
 * **Type shape:**
 *
 * `MaybeHandlers<Value, Result> = { onSome: Value -> Result, onNone: () -> Result }`
 */
export type MaybeHandlers<Value, Outcome> = {
  readonly onSome: Unary<Value, Outcome>
  readonly onNone: Lazy<Outcome>
}

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a `Some<Value>` — a `Maybe` containing a value.
 *
 * **Type shape:**
 *
 * `some : Value -> Maybe<Value>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * Maybe.some(5)       // { _tag: 'Some', value: 5 }
 * Maybe.some('hello') // { _tag: 'Some', value: 'hello' }
 */
const some = <Value>(value: Value): Maybe<Value> => ({
  _tag: 'Some',
  value,
})

/**
 * The `None` value — a `Maybe` representing absence.
 *
 * **Type shape:**
 *
 * `none : Maybe<never>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * Maybe.none // { _tag: 'None' }
 */
const none: Maybe<never> = { _tag: 'None' }

/**
 * Lifts a plain value into a `Maybe`. Equivalent to `some`.
 *
 * Provided for consistency with the monad protocol — `Maybe.of` plays
 * the same role as `Continuation.of`, `Array.of`, etc.
 *
 * **Type shape:**
 *
 * `of : Value -> Maybe<Value>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * Maybe.of(5) // { _tag: 'Some', value: 5 }
 */
const of = <Value>(value: Value): Maybe<Value> => some(value)

/**
 * Eliminates a `Maybe` by providing handlers for both cases.
 *
 * This is the exit point from `Maybe`-land. You provide two handlers —
 * one for `Some` and one for `None` — and get back a plain value.
 *
 * Curried so that handlers can be pre-baked and reused across multiple
 * `Maybe` values, and so that `run` slots cleanly into `pipe`.
 *
 * **Type shape:**
 *
 * `run : MaybeHandlers<Value, Outcome> -> Maybe<Value> -> Outcome`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const describe = Maybe.run({
 *   onSome: (value: number) => `Found: ${value}`,
 *   onNone: () => 'Nothing here',
 * })
 *
 * describe(Maybe.some(5)) // "Found: 5"
 * describe(Maybe.none)    // "Nothing here"
 */
const run = <Value, Outcome>(
  handlers: MaybeHandlers<Value, Outcome>,
) =>
  (maybe: Maybe<Value>): Outcome =>
    maybe._tag === 'Some'
      ? handlers.onSome(maybe.value)
      : handlers.onNone()

/**
 * Alias for `run`. Provided for familiarity with Scala/cats conventions.
 *
 * **Type shape:**
 *
 * `fold : MaybeHandlers<Value, Outcome> -> Maybe<Value> -> Outcome`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * Maybe.fold({
 *   onSome: (value: number) => `Found: ${value}`,
 *   onNone: () => 'Nothing',
 * })(Maybe.some(5))
 * // "Found: 5"
 */
const fold = run

/**
 * Transforms the value inside a `Maybe`. No-op if `None`.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Maybe<Value> -> Maybe<Mapped>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Maybe.some(5),
 *   Maybe.map((value: number) => value * 2),
 * )
 * // Maybe.some(10)
 *
 * pipe(
 *   Maybe.none,
 *   Maybe.map((value: number) => value * 2),
 * )
 * // Maybe.none — transform is skipped
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (maybe: Maybe<Value>): Maybe<Mapped> =>
    maybe._tag === 'Some'
      ? some(transform(maybe.value))
      : none

/**
 * Sequences two `Maybe` computations. No-op if `None`.
 *
 * Use `chain` when the transformation function itself returns a `Maybe`.
 * If it returns a plain value, use `map` instead.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Maybe<Next>) -> Maybe<Value> -> Maybe<Next>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const safeDivide = (divisor: number) => (value: number): Maybe<number> =>
 *   divisor === 0 ? Maybe.none : Maybe.some(value / divisor)
 *
 * pipe(
 *   Maybe.some(10),
 *   Maybe.chain(safeDivide(2)),
 * )
 * // Maybe.some(5)
 *
 * pipe(
 *   Maybe.some(10),
 *   Maybe.chain(safeDivide(0)),
 * )
 * // Maybe.none
 */
const chain = <Value, Next>(
  next: Unary<Value, Maybe<Next>>,
) =>
  (maybe: Maybe<Value>): Maybe<Next> =>
    maybe._tag === 'Some'
      ? next(maybe.value)
      : none

/**
 * Applies a `Maybe`-wrapped function to a `Maybe`-wrapped value.
 * Produces `None` if either the function or the value is `None`.
 *
 * **Type shape:**
 *
 * `apply : Maybe<(Value -> Mapped)> -> Maybe<Value> -> Maybe<Mapped>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const transform = Maybe.some((n: number) => n * 2)
 *
 * pipe(
 *   Maybe.some(5),
 *   Maybe.apply(transform),
 * )
 * // Maybe.some(10)
 */
const apply = <Value, Mapped>(
  maybeFunction: Maybe<Unary<Value, Mapped>>,
) =>
  (maybe: Maybe<Value>): Maybe<Mapped> =>
    maybeFunction._tag === 'Some' && maybe._tag === 'Some'
      ? some(maybeFunction.value(maybe.value))
      : none

/**
 * Lifts a binary function to work on two `Maybe` values. Produces `None`
 * if either input is `None`.
 *
 * A more ergonomic alternative to using `apply` when you have a plain
 * binary function and two `Maybe` values.
 *
 * **Type shape:**
 *
 * `lift2 : (A, B) -> C) -> Maybe<A> -> Maybe<B> -> Maybe<C>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * const add = (a: number, b: number): number => a + b
 *
 * Maybe.lift2(add)(Maybe.some(3))(Maybe.some(4)) // Maybe.some(7)
 * Maybe.lift2(add)(Maybe.some(3))(Maybe.none)    // Maybe.none
 * Maybe.lift2(add)(Maybe.none)(Maybe.some(4))    // Maybe.none
 */
const lift2 = <A, B, C>(
  fn: Binary<A, B, C>,
) =>
  (maybeA: Maybe<A>) =>
    (maybeB: Maybe<B>): Maybe<C> =>
      maybeA._tag === 'Some' && maybeB._tag === 'Some'
        ? some(fn(maybeA.value, maybeB.value))
        : none

/**
 * Lifts a ternary function to work on three `Maybe` values. Produces
 * `None` if any input is `None`.
 *
 * **Type shape:**
 *
 * `lift3 : ((A, B, C) -> D) -> Maybe<A> -> Maybe<B> -> Maybe<C> -> Maybe<D>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * const addThree = (a: number, b: number, c: number): number => a + b + c
 *
 * Maybe.lift3(addThree)(Maybe.some(1))(Maybe.some(2))(Maybe.some(3))
 * // Maybe.some(6)
 *
 * Maybe.lift3(addThree)(Maybe.some(1))(Maybe.none)(Maybe.some(3))
 * // Maybe.none
 */
const lift3 = <A, B, C, D>(
  fn: Ternary<A, B, C, D>,
) =>
  (maybeA: Maybe<A>) =>
    (maybeB: Maybe<B>) =>
      (maybeC: Maybe<C>): Maybe<D> =>
        maybeA._tag === 'Some' &&
        maybeB._tag === 'Some' &&
        maybeC._tag === 'Some'
          ? some(fn(maybeA.value, maybeB.value, maybeC.value))
          : none

/**
 * Provides an alternative `Maybe` if the current one is `None`.
 *
 * Unlike `getOrElse`, the fallback is itself a `Maybe` — useful when
 * the alternative computation might also fail.
 *
 * **Type shape:**
 *
 * `orElse : Lazy<Maybe<Value>> -> Maybe<Value> -> Maybe<Value>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Maybe.none,
 *   Maybe.orElse(() => Maybe.some(0)),
 * )
 * // Maybe.some(0)
 *
 * pipe(
 *   Maybe.some(5),
 *   Maybe.orElse(() => Maybe.some(0)),
 * )
 * // Maybe.some(5) — fallback is ignored
 *
 * // Chaining fallbacks
 * pipe(
 *   findInCache(key),
 *   Maybe.orElse(() => findInDatabase(key)),
 *   Maybe.orElse(() => Maybe.some(defaultValue)),
 * )
 */
const orElse = <Value>(
  fallback: Lazy<Maybe<Value>>,
) =>
  (maybe: Maybe<Value>): Maybe<Value> =>
    maybe._tag === 'Some' ? maybe : fallback()

/**
 * Keeps the value if it satisfies the predicate, otherwise returns `None`.
 *
 * **Type shape:**
 *
 * `filter : Predicate<Value> -> Maybe<Value> -> Maybe<Value>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Maybe.some(5),
 *   Maybe.filter((value: number) => value > 3),
 * )
 * // Maybe.some(5)
 *
 * pipe(
 *   Maybe.some(2),
 *   Maybe.filter((value: number) => value > 3),
 * )
 * // Maybe.none
 *
 * pipe(
 *   Maybe.none,
 *   Maybe.filter((value: number) => value > 3),
 * )
 * // Maybe.none
 */
const filter = <Value>(
  predicate: Predicate<Value>,
) =>
  (maybe: Maybe<Value>): Maybe<Value> =>
    maybe._tag === 'Some' && predicate(maybe.value)
      ? maybe
      : none

/**
 * Runs a side-effecting function on the value if `Some`, then passes
 * the original `Maybe` through unchanged.
 *
 * Useful for logging and debugging in the middle of a pipeline without
 * breaking the chain.
 *
 * **Type shape:**
 *
 * `tap : (Value -> void) -> Maybe<Value> -> Maybe<Value>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Maybe.some(5),
 *   Maybe.tap((value) => console.log(`Before: ${value}`)),
 *   Maybe.map((value: number) => value * 2),
 *   Maybe.tap((value) => console.log(`After: ${value}`)),
 * )
 * // logs "Before: 5", logs "After: 10"
 * // produces Maybe.some(10)
 */
const tap = <Value>(
  sideEffect: Unary<Value, void>,
) =>
  (maybe: Maybe<Value>): Maybe<Value> => {
    if (maybe._tag === 'Some') sideEffect(maybe.value)
    return maybe
  }

/**
 * Combines two `Maybe` values into a `Maybe` of a tuple. Produces `None`
 * if either value is `None`.
 *
 * **Type shape:**
 *
 * `zip : Maybe<A> -> Maybe<B> -> Maybe<[A, B]>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * Maybe.zip(Maybe.some(1))(Maybe.some('hello'))
 * // Maybe.some([1, 'hello'])
 *
 * Maybe.zip(Maybe.some(1))(Maybe.none)
 * // Maybe.none
 */
const zip = <A>(maybeA: Maybe<A>) =>
  <B>(maybeB: Maybe<B>): Maybe<readonly [A, B]> =>
    lift2(
      (a: A, b: B): readonly [A, B] => [a, b] as const,
    )(maybeA)(maybeB)

/**
 * Converts a `ReadonlyArray<Maybe<Value>>` into a
 * `Maybe<ReadonlyArray<Value>>`. If any element is `None`, the whole
 * result is `None`.
 *
 * **Type shape:**
 *
 * `sequence : ReadonlyArray<Maybe<Value>> -> Maybe<ReadonlyArray<Value>>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * Maybe.sequence([Maybe.some(1), Maybe.some(2), Maybe.some(3)])
 * // Maybe.some([1, 2, 3])
 *
 * Maybe.sequence([Maybe.some(1), Maybe.none, Maybe.some(3)])
 * // Maybe.none
 */
const sequence = <Value>(
  maybes: ReadonlyArray<Maybe<Value>>,
): Maybe<ReadonlyArray<Value>> => {
  const values: Array<Value> = []
  for (const maybe of maybes) {
    if (maybe._tag === 'None') return none
    values.push(maybe.value)
  }
  return some(values)
}

/**
 * Maps over an array with a function that returns a `Maybe`, then
 * sequences the results. If any element produces `None`, the whole
 * result is `None`.
 *
 * Equivalent to `sequence(array.map(fn))` but without creating an
 * intermediate array of `Maybe` values.
 *
 * **Type shape:**
 *
 * `traverse : (Value -> Maybe<Mapped>) -> ReadonlyArray<Value> -> Maybe<ReadonlyArray<Mapped>>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * const parseNumber = (s: string): Maybe<number> =>
 *   isNaN(Number(s)) ? Maybe.none : Maybe.some(Number(s))
 *
 * Maybe.traverse(parseNumber)(['1', '2', '3'])
 * // Maybe.some([1, 2, 3])
 *
 * Maybe.traverse(parseNumber)(['1', 'oops', '3'])
 * // Maybe.none
 */
const traverse = <Value, Mapped>(
  fn: Unary<Value, Maybe<Mapped>>,
) =>
  (values: ReadonlyArray<Value>): Maybe<ReadonlyArray<Mapped>> => {
    const mapped: Array<Mapped> = []
    for (const value of values) {
      const result = fn(value)
      if (result._tag === 'None') return none
      mapped.push(result.value)
    }
    return some(mapped)
  }

/**
 * Converts a `Nullable<Value>` into a `Maybe<Value>`.
 *
 * `null` and `undefined` become `None`; all other values become `Some`.
 * This is the bridge between native JavaScript nullability and the
 * `Maybe` monad.
 *
 * **Type shape:**
 *
 * `fromNullable : Nullable<Value> -> Maybe<Value>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * Maybe.fromNullable(5)         // Maybe.some(5)
 * Maybe.fromNullable(null)      // Maybe.none
 * Maybe.fromNullable(undefined) // Maybe.none
 * Maybe.fromNullable(0)         // Maybe.some(0) — 0 is a value, not absent
 * Maybe.fromNullable(false)     // Maybe.some(false) — false is a value, not absent
 */
const fromNullable = <Value>(
  value: Nullable<Value>,
): Maybe<Value> =>
  value != null ? some(value) : none

/**
 * Extracts the value from a `Maybe`, or returns a fallback if `None`.
 *
 * The fallback is a `Lazy<Value>` — a function producing the default
 * value. This avoids evaluating the fallback when it is not needed.
 *
 * **Type shape:**
 *
 * `getOrElse : Lazy<Value> -> Maybe<Value> -> Value`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(Maybe.some(5), Maybe.getOrElse(() => 0)) // 5
 * pipe(Maybe.none, Maybe.getOrElse(() => 0))    // 0
 */
const getOrElse = <Value>(
  fallback: Lazy<Value>,
) =>
  (maybe: Maybe<Value>): Value =>
    maybe._tag === 'Some' ? maybe.value : fallback()

/**
 * Converts a `Maybe<Value>` into a `Result<Value, Error>` by providing
 * an error value for the `None` case.
 *
 * **Type shape:**
 *
 * `toResult : Lazy<Error> -> Maybe<Value> -> Result<Value, Error>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Maybe.some(5),
 *   Maybe.toResult(() => 'value was missing'),
 * )
 * // Result.ok(5)
 *
 * pipe(
 *   Maybe.none,
 *   Maybe.toResult(() => 'value was missing'),
 * )
 * // Result.err('value was missing')
 */
const toResult = <Value, Error>(
  onNone: Lazy<Error>,
) =>
  (maybe: Maybe<Value>): Result<Value, Error> =>
    maybe._tag === 'Some'
      ? Result.ok(maybe.value)
      : Result.err(onNone())

/**
 * Returns `true` if the `Maybe` is `Some`.
 *
 * Narrows the type to `Some<Value>` in the surrounding scope.
 *
 * **Type shape:**
 *
 * `isSome : Maybe<Value> -> maybe is Some<Value>`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * const value: Maybe<number> = Maybe.some(5)
 *
 * if (Maybe.isSome(value)) {
 *   value.value // 5 — narrowed to Some<number>
 * }
 */
const isSome = <Value>(maybe: Maybe<Value>): maybe is Some<Value> =>
  maybe._tag === 'Some'

/**
 * Returns `true` if the `Maybe` is `None`.
 *
 * Narrows the type to `None` in the surrounding scope.
 *
 * **Type shape:**
 *
 * `isNone : Maybe<Value> -> maybe is None`
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * const value: Maybe<number> = Maybe.none
 *
 * if (Maybe.isNone(value)) {
 *   // narrowed to None here
 *   console.log('Nothing here')
 * }
 */
const isNone = <Value>(maybe: Maybe<Value>): maybe is None =>
  maybe._tag === 'None'

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Maybe` monad for explicit, composable optional values.
 *
 * A `Maybe<Value>` is either `Some<Value>` (a value exists) or `None`
 * (no value). Unlike `null` and `undefined`, absence is encoded in the
 * type — the compiler forces you to handle both cases.
 *
 * @example
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const safeDivide = (divisor: number) => (value: number): Maybe<number> =>
 *   divisor === 0 ? Maybe.none : Maybe.some(value / divisor)
 *
 * pipe(
 *   Maybe.some(10),
 *   Maybe.chain(safeDivide(2)),
 *   Maybe.map((value: number) => `Result: ${value}`),
 *   Maybe.run({
 *     onSome: (value: string) => value,
 *     onNone: () => 'Could not divide',
 *   }),
 * )
 * // "Result: 5"
 */
export const Maybe = {
  of,
  some,
  none,
  run,
  fold,
  map,
  chain,
  apply,
  lift2,
  lift3,
  orElse,
  filter,
  tap,
  zip,
  sequence,
  traverse,
  fromNullable,
  getOrElse,
  toResult,
  isSome,
  isNone,
} as const
