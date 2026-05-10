/**
 * @file     logic.ts
 * @location src/monad/logic.ts
 * @brief    The Logic monad for backtracking search and non-determinism.
 */

import type { Unary, Predicate } from '../prelude/types'
import { Maybe } from './maybe'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single step in a `Logic` stream.
 *
 * Either `Done` (no more solutions) or `Yield` (one solution plus a
 * thunk producing the rest of the stream).
 */
type LogicStep<Value> =
  | { readonly _tag: 'Done' }
  | { readonly _tag: 'Yield'; readonly value: Value; readonly next: Logic<Value> }

/**
 * A `Logic<Value>` is a lazy, possibly infinite stream of solutions.
 *
 * Pulling on a `Logic` produces either no solutions (`Done`) or one
 * solution plus the rest of the stream (`Yield`). This makes it
 * suitable for backtracking search, Prolog-style nondeterminism, and
 * generator-like lazy sequences.
 *
 * `chain` is the conjunction combinator: for each solution, try all
 * further solutions the continuation produces. `append` is the
 * disjunction combinator: try all solutions from the first stream,
 * then all from the second.
 *
 * **Type shape:**
 *
 * `Logic<Value> = () -> LogicStep<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 *
 * // All pairs (a, b) where a + b === 5
 * const digits = Logic.fromArray([0, 1, 2, 3, 4, 5])
 *
 * const pairs = Logic.chain((a: number) =>
 *   Logic.chain((b: number) =>
 *     a + b === 5 ? Logic.of(a, b) : Logic.empty()
 *   )(digits)
 * )(digits)
 *
 * Logic.toArray(pairs)
 * // [[0,5],[1,4],[2,3],[3,2],[4,1],[5,0]] (approximately — depends on order)
 */
export type Logic<Value> = () => LogicStep<Value>

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const done = <Value>(): LogicStep<Value> => ({ _tag: 'Done' })

const yieldStep = <Value>(
  value: Value,
  next: Logic<Value>,
): LogicStep<Value> => ({ _tag: 'Yield', value, next })

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produces a `Logic` stream with no solutions.
 *
 * **Type shape:**
 *
 * `empty : () -> Logic<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 *
 * Logic.toArray(Logic.empty()) // []
 */
const empty = <Value>(): Logic<Value> => () => done()

/**
 * Lifts a single value into `Logic`.
 *
 * **Type shape:**
 *
 * `of : Value -> Logic<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 *
 * Logic.toArray(Logic.of(42)) // [42]
 */
const of = <Value>(value: Value): Logic<Value> =>
  () => yieldStep(value, empty())

/**
 * Prepends a value onto a `Logic` stream.
 *
 * **Type shape:**
 *
 * `cons : (Value, Logic<Value>) -> Logic<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 *
 * Logic.toArray(Logic.cons(1, Logic.cons(2, Logic.empty())))
 * // [1, 2]
 */
const cons = <Value>(
  value: Value,
  rest: Logic<Value>,
): Logic<Value> =>
  () => yieldStep(value, rest)

/**
 * Constructs a `Logic` stream from a `ReadonlyArray`.
 *
 * **Type shape:**
 *
 * `fromArray : ReadonlyArray<Value> -> Logic<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 *
 * Logic.toArray(Logic.fromArray([1, 2, 3])) // [1, 2, 3]
 */
const fromArray = <Value>(items: ReadonlyArray<Value>): Logic<Value> => {
  const go = (index: number): Logic<Value> => () =>
    index >= items.length
      ? done()
      : yieldStep(items[index] as Value, go(index + 1))
  return go(0)
}

/**
 * Appends two `Logic` streams. All solutions from the first are
 * produced before any from the second. This is the disjunction
 * ("or") combinator.
 *
 * **Type shape:**
 *
 * `append : Logic<Value> -> Logic<Value> -> Logic<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 *
 * Logic.toArray(
 *   Logic.append(Logic.fromArray([3, 4]))(Logic.fromArray([1, 2]))
 * )
 * // [1, 2, 3, 4]
 */
const append = <Value>(
  second: Logic<Value>,
) =>
  (first: Logic<Value>): Logic<Value> => () => {
    const step = first()
    return step._tag === 'Done'
      ? second()
      : yieldStep(step.value, append(second)(step.next))
  }

/**
 * Transforms each solution in a `Logic` stream.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Logic<Value> -> Logic<Mapped>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Logic.fromArray([1, 2, 3]),
 *   Logic.map((n: number) => n * 2),
 *   Logic.toArray,
 * )
 * // [2, 4, 6]
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (logic: Logic<Value>): Logic<Mapped> => () => {
    const step = logic()
    return step._tag === 'Done'
      ? done()
      : yieldStep(transform(step.value), map(transform)(step.next))
  }

/**
 * Applies a function to each solution and concatenates the resulting
 * streams. This is the conjunction ("and") combinator — for each
 * solution, produce further solutions.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Logic<Next>) -> Logic<Value> -> Logic<Next>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Logic.fromArray([1, 2, 3]),
 *   Logic.chain((n: number) => Logic.fromArray([n, n * 10])),
 *   Logic.toArray,
 * )
 * // [1, 10, 2, 20, 3, 30]
 */
const chain = <Value, Next>(
  next: Unary<Value, Logic<Next>>,
) =>
  (logic: Logic<Value>): Logic<Next> => () => {
    const step = logic()
    if (step._tag === 'Done') return done()
    return append(chain(next)(step.next))(next(step.value))()
  }

/**
 * Keeps only solutions that satisfy the predicate.
 *
 * **Type shape:**
 *
 * `filter : Predicate<Value> -> Logic<Value> -> Logic<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Logic.fromArray([1, 2, 3, 4, 5]),
 *   Logic.filter((n: number) => n % 2 === 0),
 *   Logic.toArray,
 * )
 * // [2, 4]
 */
const filter = <Value>(
  predicate: Predicate<Value>,
) =>
  (logic: Logic<Value>): Logic<Value> => () => {
    let current: LogicStep<Value> = logic()
    while (current._tag === 'Yield') {
      if (predicate(current.value)) {
        return yieldStep(current.value, filter(predicate)(current.next))
      }
      current = current.next()
    }
    return done()
  }

/**
 * Takes the first `n` solutions from a `Logic` stream.
 *
 * **Type shape:**
 *
 * `take : number -> Logic<Value> -> Logic<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Logic.fromArray([1, 2, 3, 4, 5]),
 *   Logic.take(3),
 *   Logic.toArray,
 * )
 * // [1, 2, 3]
 */
const take = (n: number) =>
  <Value>(logic: Logic<Value>): Logic<Value> => {
    if (n <= 0) return empty()
    return () => {
      const step = logic()
      return step._tag === 'Done'
        ? done()
        : yieldStep(step.value, take(n - 1)(step.next))
    }
  }

/**
 * Returns the first solution as a `Maybe`. `Maybe.none` if no solutions.
 *
 * **Type shape:**
 *
 * `head : Logic<Value> -> Maybe<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 *
 * Logic.head(Logic.fromArray([1, 2, 3])) // Maybe.some(1)
 * Logic.head(Logic.empty())              // Maybe.none
 */
const head = <Value>(logic: Logic<Value>): Maybe<Value> => {
  const step = logic()
  return step._tag === 'Done' ? Maybe.none : Maybe.some(step.value)
}

/**
 * Forces the entire stream into an array. Will not terminate on infinite
 * streams — use `take` first to bound the result.
 *
 * **Type shape:**
 *
 * `toArray : Logic<Value> -> ReadonlyArray<Value>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 *
 * Logic.toArray(Logic.fromArray([1, 2, 3])) // [1, 2, 3]
 * Logic.toArray(Logic.take(3)(Logic.fromArray([1, 2, 3, 4, 5]))) // [1, 2, 3]
 */
const toArray = <Value>(logic: Logic<Value>): ReadonlyArray<Value> => {
  const out: Array<Value> = []
  let step = logic()
  while (step._tag === 'Yield') {
    out.push(step.value)
    step = step.next()
  }
  return out
}

/**
 * Succeeds (produces one solution of `undefined`) if the condition is
 * true, fails (produces no solutions) otherwise. Used as a guard inside
 * `chain` to prune the search space.
 *
 * Renamed from `guard` to avoid confusion with the `prelude/guard`
 * module.
 *
 * **Type shape:**
 *
 * `when : boolean -> Logic<void>`
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // Only even numbers
 * pipe(
 *   Logic.fromArray([1, 2, 3, 4, 5]),
 *   Logic.chain((n: number) =>
 *     pipe(
 *       Logic.when(n % 2 === 0),
 *       Logic.map(() => n),
 *     )
 *   ),
 *   Logic.toArray,
 * )
 * // [2, 4]
 */
const when = (condition: boolean): Logic<void> =>
  condition ? of(undefined) : empty()

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Logic` monad for backtracking search and non-determinism.
 *
 * A `Logic<Value>` is a lazy stream of solutions. `chain` is conjunction
 * (for each solution, try all further ones). `append` is disjunction
 * (try both streams). `when` prunes the search space.
 *
 * @example
 * import { Logic } from 'heron-ts/monad/logic'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // Pythagorean triples up to 20
 * const numbers = Logic.fromArray([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20])
 *
 * const triples = pipe(
 *   numbers,
 *   Logic.chain((a: number) => pipe(
 *     numbers,
 *     Logic.chain((b: number) => pipe(
 *       numbers,
 *       Logic.chain((c: number) => pipe(
 *         Logic.when(a * a + b * b === c * c && a < b),
 *         Logic.map(() => [a, b, c] as const),
 *       )),
 *     )),
 *   )),
 * )
 *
 * Logic.toArray(triples)
 * // [[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15]]
 */
export const Logic = {
  of,
  empty,
  cons,
  fromArray,
  append,
  map,
  chain,
  filter,
  take,
  head,
  toArray,
  when,
} as const
