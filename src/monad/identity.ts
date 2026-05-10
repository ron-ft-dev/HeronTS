/**
 * @file     identity.ts
 * @location src/monad/identity.ts
 * @brief    The Identity monad — the trivial monad that adds no effects.
 */

import type { Unary } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Identity<Value>` monad wraps a plain `Value` with no additional
 * structure or effects. It is the simplest possible monad.
 *
 * Its primary use is in monad-generic code: when you have an abstraction
 * that works over any monad and you want to "turn off" the monadic effects,
 * you substitute `Identity`. Because `Identity<Value>` is literally just
 * `Value`, the overhead is zero.
 *
 * **Type shape:**
 *
 * `Identity<Value> = Value`
 *
 * @example
 * import { Identity } from 'heron-ts/monad/identity'
 *
 * const five: Identity<number> = Identity.of(5)
 * // five === 5
 *
 * const ten = Identity.map((n: number) => n * 2)(five)
 * // ten === 10
 */
export type Identity<Value> = Value

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into `Identity`. A no-op — returns the value as-is.
 *
 * **Type shape:**
 *
 * `of : Value -> Identity<Value>`
 *
 * @example
 * import { Identity } from 'heron-ts/monad/identity'
 *
 * Identity.of(5)       // 5
 * Identity.of('hello') // 'hello'
 */
const of = <Value>(value: Value): Identity<Value> => value

/**
 * Extracts the value from an `Identity`. A no-op — returns the value as-is.
 *
 * **Type shape:**
 *
 * `run : Identity<Value> -> Value`
 *
 * @example
 * import { Identity } from 'heron-ts/monad/identity'
 *
 * Identity.run(Identity.of(5)) // 5
 */
const run = <Value>(identity: Identity<Value>): Value => identity

/**
 * Transforms the value inside an `Identity`.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Identity<Value> -> Identity<Mapped>`
 *
 * @example
 * import { Identity } from 'heron-ts/monad/identity'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Identity.of(5),
 *   Identity.map((n: number) => n * 2),
 *   Identity.run,
 * )
 * // 10
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (identity: Identity<Value>): Identity<Mapped> =>
    transform(identity)

/**
 * Sequences two `Identity` computations.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Identity<Next>) -> Identity<Value> -> Identity<Next>`
 *
 * @example
 * import { Identity } from 'heron-ts/monad/identity'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Identity.of(5),
 *   Identity.chain((n: number) => Identity.of(n * 2)),
 *   Identity.run,
 * )
 * // 10
 */
const chain = <Value, Next>(
  next: Unary<Value, Identity<Next>>,
) =>
  (identity: Identity<Value>): Identity<Next> =>
    next(identity)

/**
 * Applies an `Identity`-wrapped function to an `Identity`-wrapped value.
 *
 * **Type shape:**
 *
 * `apply : Identity<(Value -> Mapped)> -> Identity<Value> -> Identity<Mapped>`
 *
 * @example
 * import { Identity } from 'heron-ts/monad/identity'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Identity.of(5),
 *   Identity.apply(Identity.of((n: number) => n * 2)),
 * )
 * // 10
 */
const apply = <Value, Mapped>(
  identityOfFunction: Identity<Unary<Value, Mapped>>,
) =>
  (identity: Identity<Value>): Identity<Mapped> =>
    identityOfFunction(identity)

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Identity` monad — the trivial monad with no effects.
 *
 * `Identity<Value>` is literally `Value`. Every operation is a thin
 * wrapper that immediately delegates to the underlying value.
 *
 * @example
 * import { Identity } from 'heron-ts/monad/identity'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Identity.of(5),
 *   Identity.map((n: number) => n * 2),
 *   Identity.map((n: number) => `Result: ${n}`),
 *   Identity.run,
 * )
 * // "Result: 10"
 */
export const Identity = {
  of,
  run,
  map,
  chain,
  apply,
} as const
