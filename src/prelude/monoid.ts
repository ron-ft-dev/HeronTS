/**
 * @file     monoid.ts
 * @location src/prelude/monoid.ts
 * @brief    The Monoid typeclass and standard instances.
 */

/**
 * A `Monoid<Value>` is an algebraic structure with:
 * - An identity element `empty` such that `concat(empty, x) === x` and
 *   `concat(x, empty) === x`.
 * - An associative binary operation `concat` such that
 *   `concat(concat(a, b), c) === concat(a, concat(b, c))`.
 *
 * Used by `Writer` to accumulate logs, by `Distribution` to combine
 * weights, and anywhere you need a well-behaved append-with-identity.
 *
 * **Type shape:**
 *
 * `Monoid<Value> = { empty: Value, concat: (Value, Value) -> Value }`
 *
 * @example
 * import { stringMonoid } from 'heron-ts/prelude/monoid'
 *
 * stringMonoid.concat('hello ', 'world') // 'hello world'
 * stringMonoid.concat(stringMonoid.empty, 'world') // 'world'
 */
export type Monoid<Value> = {
  readonly empty: Value
  readonly concat: (a: Value, b: Value) => Value
}

/**
 * The string monoid under concatenation.
 *
 * @example
 * stringMonoid.empty           // ''
 * stringMonoid.concat('a', 'b') // 'ab'
 */
export const stringMonoid: Monoid<string> = {
  empty: '',
  concat: (a, b) => a + b,
}

/**
 * The array monoid under concatenation.
 *
 * @example
 * const m = arrayMonoid<number>()
 * m.concat([1, 2], [3, 4]) // [1, 2, 3, 4]
 */
export const arrayMonoid = <Value>(): Monoid<ReadonlyArray<Value>> => ({
  empty: [],
  concat: (a, b) => [...a, ...b],
})

/**
 * The number monoid under addition.
 *
 * @example
 * sumMonoid.empty           // 0
 * sumMonoid.concat(3, 4)    // 7
 */
export const sumMonoid: Monoid<number> = {
  empty: 0,
  concat: (a, b) => a + b,
}

/**
 * The number monoid under multiplication.
 *
 * @example
 * productMonoid.empty        // 1
 * productMonoid.concat(3, 4) // 12
 */
export const productMonoid: Monoid<number> = {
  empty: 1,
  concat: (a, b) => a * b,
}

/**
 * The boolean monoid under conjunction (AND).
 *
 * @example
 * allMonoid.empty              // true
 * allMonoid.concat(true, false) // false
 */
export const allMonoid: Monoid<boolean> = {
  empty: true,
  concat: (a, b) => a && b,
}

/**
 * The boolean monoid under disjunction (OR).
 *
 * @example
 * anyMonoid.empty               // false
 * anyMonoid.concat(false, true) // true
 */
export const anyMonoid: Monoid<boolean> = {
  empty: false,
  concat: (a, b) => a || b,
}
