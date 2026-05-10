/**
 * @file     list.ts
 * @location src/monad/list.ts
 * @brief    The List monad for non-deterministic computations.
 */

import type { Unary, Predicate, Nullable } from '../prelude/types'
import { isDefined } from '../prelude/guard'
import { Maybe } from './maybe'
import { Result } from './result'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A `List<Value>` is a `ReadonlyArray<Value>`. The List monad treats
 * arrays as non-deterministic computations: a list of values represents
 * multiple possible outcomes simultaneously.
 *
 * `chain` is the non-deterministic choice combinator — it applies a
 * function to every element and flattens the results, modeling "for
 * each possibility, try all these further possibilities."
 *
 * **Type shape:**
 *
 * `List<Value> = ReadonlyArray<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * // All combinations of coins that sum to a target
 * const coins = List.of(1, 5, 10, 25)
 * const pairs = List.chain((a: number) =>
 *   List.chain((b: number) =>
 *     a + b === 30 ? List.of([a, b]) : List.empty()
 *   )(coins)
 * )(coins)
 * // [[5, 25], [25, 5]]
 */
export type List<Value> = ReadonlyArray<Value>

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a `List` from individual values.
 *
 * **Type shape:**
 *
 * `of : (...Value) -> List<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.of(1, 2, 3) // [1, 2, 3]
 */
const of = <Value>(...values: ReadonlyArray<Value>): List<Value> =>
  values

/**
 * Returns an empty `List`.
 *
 * **Type shape:**
 *
 * `empty : () -> List<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.empty() // []
 */
const empty = <Value>(): List<Value> => []

/**
 * Constructs a `List` from an existing `ReadonlyArray`.
 *
 * **Type shape:**
 *
 * `from : ReadonlyArray<Value> -> List<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.from([1, 2, 3]) // [1, 2, 3]
 */
const from = <Value>(items: ReadonlyArray<Value>): List<Value> => items

/**
 * Converts a `List` to a plain mutable array.
 *
 * **Type shape:**
 *
 * `toArray : List<Value> -> Array<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.toArray(List.of(1, 2, 3)) // [1, 2, 3]
 */
const toArray = <Value>(items: List<Value>): Array<Value> => [...items]

/**
 * Transforms each element in a `List`.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> List<Value> -> List<Mapped>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   List.of(1, 2, 3),
 *   List.map((n: number) => n * 2),
 * )
 * // [2, 4, 6]
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (items: List<Value>): List<Mapped> =>
    items.map(transform)

/**
 * Applies a function to each element and flattens the results. This is
 * the non-deterministic choice combinator — for each element, produce a
 * list of further possibilities, and collect them all.
 *
 * **Type shape:**
 *
 * `chain : (Value -> List<Next>) -> List<Value> -> List<Next>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   List.of(1, 2, 3),
 *   List.chain((n: number) => List.of(n, n * 10)),
 * )
 * // [1, 10, 2, 20, 3, 30]
 */
const chain = <Value, Next>(
  next: Unary<Value, List<Next>>,
) =>
  (items: List<Value>): List<Next> =>
    items.flatMap(next as (value: Value) => Next[])

/**
 * Applies a list of functions to a list of values, producing all
 * combinations.
 *
 * **Type shape:**
 *
 * `apply : List<(Value -> Mapped)> -> List<Value> -> List<Mapped>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   List.of(1, 2, 3),
 *   List.apply(List.of(
 *     (n: number) => n * 2,
 *     (n: number) => n + 10,
 *   )),
 * )
 * // [2, 4, 6, 11, 12, 13]
 */
const apply = <Value, Mapped>(
  listOfFunctions: List<Unary<Value, Mapped>>,
) =>
  (items: List<Value>): List<Mapped> =>
    listOfFunctions.flatMap((fn) => items.map(fn))

/**
 * Keeps only elements that satisfy the predicate.
 *
 * **Type shape:**
 *
 * `filter : Predicate<Value> -> List<Value> -> List<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   List.of(1, 2, 3, 4, 5),
 *   List.filter((n: number) => n % 2 === 0),
 * )
 * // [2, 4]
 */
const filter = <Value>(
  predicate: Predicate<Value>,
) =>
  (items: List<Value>): List<Value> =>
    items.filter(predicate)

/**
 * Strips `null` and `undefined` elements and narrows the type.
 *
 * **Type shape:**
 *
 * `compact : List<Nullable<Value>> -> List<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.compact([1, null, 2, undefined, 3]) // [1, 2, 3]
 */
const compact = <Value>(
  items: List<Nullable<Value>>,
): List<Value> =>
  items.filter(isDefined)

/**
 * Reduces a `List` to a single value.
 *
 * **Type shape:**
 *
 * `reduce : (Accumulator, (Accumulator, Value) -> Accumulator) -> List<Value> -> Accumulator`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   List.of(1, 2, 3, 4, 5),
 *   List.reduce(0, (acc, n) => acc + n),
 * )
 * // 15
 */
const reduce = <Value, Accumulator>(
  seed: Accumulator,
  step: (accumulator: Accumulator, value: Value) => Accumulator,
) =>
  (items: List<Value>): Accumulator =>
    items.reduce(step, seed)

/**
 * Returns the first element as a `Maybe`. `Maybe.none` if the list is empty.
 *
 * **Type shape:**
 *
 * `head : List<Value> -> Maybe<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.head(List.of(1, 2, 3)) // Maybe.some(1)
 * List.head(List.empty())     // Maybe.none
 */
const head = <Value>(items: List<Value>): Maybe<Value> =>
  items.length === 0 ? Maybe.none : Maybe.some(items[0] as Value)

/**
 * Returns all elements after the first.
 *
 * **Type shape:**
 *
 * `tail : List<Value> -> List<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.tail(List.of(1, 2, 3)) // [2, 3]
 * List.tail(List.empty())     // []
 */
const tail = <Value>(items: List<Value>): List<Value> =>
  items.slice(1)

/**
 * Reverses the list.
 *
 * **Type shape:**
 *
 * `reverse : List<Value> -> List<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.reverse(List.of(1, 2, 3)) // [3, 2, 1]
 */
const reverse = <Value>(items: List<Value>): List<Value> =>
  [...items].reverse()

/**
 * Takes the first `n` elements.
 *
 * **Type shape:**
 *
 * `take : number -> List<Value> -> List<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(List.of(1, 2, 3, 4, 5), List.take(3))
 * // [1, 2, 3]
 */
const take = (n: number) =>
  <Value>(items: List<Value>): List<Value> =>
    items.slice(0, n)

/**
 * Drops the first `n` elements.
 *
 * **Type shape:**
 *
 * `drop : number -> List<Value> -> List<Value>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(List.of(1, 2, 3, 4, 5), List.drop(2))
 * // [3, 4, 5]
 */
const drop = (n: number) =>
  <Value>(items: List<Value>): List<Value> =>
    items.slice(n)

/**
 * Produces a `List` of numbers from `start` (inclusive) to `end`
 * (exclusive) with an optional `step`.
 *
 * **Type shape:**
 *
 * `range : (number, number, number?) -> List<number>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.range(0, 5)     // [0, 1, 2, 3, 4]
 * List.range(0, 10, 2) // [0, 2, 4, 6, 8]
 * List.range(5, 0, -1) // [5, 4, 3, 2, 1]
 */
const range = (
  start: number,
  end: number,
  step = 1,
): List<number> => {
  if (step === 0) throw new Error('List.range: step cannot be zero')
  const out: Array<number> = []
  if (step > 0) {
    for (let i = start; i < end; i += step) out.push(i)
  } else {
    for (let i = start; i > end; i += step) out.push(i)
  }
  return out
}

/**
 * Produces the cartesian product of two lists as a list of pairs.
 *
 * **Type shape:**
 *
 * `zip : List<A> -> List<B> -> List<readonly [A, B]>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.zip(List.of(1, 2))(List.of('a', 'b'))
 * // [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
 */
const zip = <A>(listA: List<A>) =>
  <B>(listB: List<B>): List<readonly [A, B]> =>
    listA.flatMap((a) => listB.map((b): readonly [A, B] => [a, b]))

/**
 * Returns all non-empty suffixes of the list, including the list itself
 * and the empty list at the end.
 *
 * **Type shape:**
 *
 * `tails : List<Value> -> List<List<Value>>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 *
 * List.tails(List.of(1, 2, 3))
 * // [[1, 2, 3], [2, 3], [3], []]
 */
const tails = <Value>(items: List<Value>): List<List<Value>> => {
  const out: Array<List<Value>> = []
  for (let i = 0; i < items.length; i++) out.push(items.slice(i))
  out.push([])
  return out
}

/**
 * Converts a `List<Maybe<Value>>` into a `Maybe<List<Value>>`. Returns
 * `Maybe.none` if any element is `Maybe.none`.
 *
 * **Type shape:**
 *
 * `sequenceMaybe : List<Maybe<Value>> -> Maybe<List<Value>>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * List.sequenceMaybe([Maybe.some(1), Maybe.some(2), Maybe.some(3)])
 * // Maybe.some([1, 2, 3])
 *
 * List.sequenceMaybe([Maybe.some(1), Maybe.none, Maybe.some(3)])
 * // Maybe.none
 */
const sequenceMaybe = <Value>(
  items: List<Maybe<Value>>,
): Maybe<List<Value>> => {
  const out: Array<Value> = []
  for (const item of items) {
    if (item._tag === 'None') return Maybe.none
    out.push(item.value)
  }
  return Maybe.some(out)
}

/**
 * Converts a `List<Result<Value, Error>>` into a
 * `Result<List<Value>, Error>`. Stops on the first `Err`.
 *
 * **Type shape:**
 *
 * `sequenceResult : List<Result<Value, Error>> -> Result<List<Value>, Error>`
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { Result } from 'heron-ts/monad/result'
 *
 * List.sequenceResult([Result.ok(1), Result.ok(2), Result.ok(3)])
 * // Result.ok([1, 2, 3])
 *
 * List.sequenceResult([Result.ok(1), Result.err('oops'), Result.ok(3)])
 * // Result.err('oops')
 */
const sequenceResult = <Value, Error>(
  items: List<Result<Value, Error>>,
): Result<List<Value>, Error> =>
  Result.sequence(items) as Result<List<Value>, Error>

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `List` monad for non-deterministic computations.
 *
 * A `List<Value>` is a `ReadonlyArray<Value>`. The monadic `chain`
 * operation applies a function to every element and flattens, modeling
 * multiple simultaneous outcomes.
 *
 * @example
 * import { List } from 'heron-ts/monad/list'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // All pairs (a, b) where a + b === 5
 * const digits = List.range(0, 6)
 *
 * pipe(
 *   digits,
 *   List.chain((a: number) =>
 *     pipe(
 *       digits,
 *       List.chain((b: number) =>
 *         a + b === 5 ? List.of([a, b] as const) : List.empty()
 *       ),
 *     )
 *   ),
 * )
 * // [[0,5],[1,4],[2,3],[3,2],[4,1],[5,0]]
 */
export const List = {
  of,
  empty,
  from,
  toArray,
  map,
  chain,
  apply,
  filter,
  compact,
  reduce,
  head,
  tail,
  reverse,
  take,
  drop,
  range,
  zip,
  tails,
  sequenceMaybe,
  sequenceResult,
} as const
