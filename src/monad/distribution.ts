/**
 * @file     distribution.ts
 * @location src/monad/distribution.ts
 * @brief    The Distribution monad for finite discrete probability distributions.
 */

import type { Unary, Predicate } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A `Distribution<Value>` is a finite, discrete probability distribution:
 * a `ReadonlyArray` of `(value, weight)` pairs.
 *
 * Weights are not required to sum to 1 — use `Distribution.normalize`
 * to collapse duplicates and renormalize. This allows `chain` to
 * multiply weights cheaply without normalizing at each step.
 *
 * **Type shape:**
 *
 * `Distribution<Value> = ReadonlyArray<readonly [Value, number]>`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 *
 * const fairDie = Distribution.uniform([1, 2, 3, 4, 5, 6])
 *
 * Distribution.probability((n: number) => n > 3)(fairDie)
 * // 0.5
 */
export type Distribution<Value> = ReadonlyArray<readonly [Value, number]>

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const sumWeights = (
  pairs: ReadonlyArray<readonly [unknown, number]>,
): number =>
  pairs.reduce((accumulator, [, weight]) => accumulator + weight, 0)

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a single value into `Distribution` with weight 1.
 *
 * **Type shape:**
 *
 * `of : Value -> Distribution<Value>`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 *
 * Distribution.of(5) // [[5, 1]]
 */
const of = <Value>(value: Value): Distribution<Value> =>
  [[value, 1]]

/**
 * Constructs a uniform distribution over a list of outcomes.
 *
 * **Type shape:**
 *
 * `uniform : ReadonlyArray<Value> -> Distribution<Value>`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 *
 * Distribution.uniform([1, 2, 3, 4, 5, 6])
 * // [[1, 1/6], [2, 1/6], ..., [6, 1/6]]
 */
const uniform = <Value>(
  outcomes: ReadonlyArray<Value>,
): Distribution<Value> => {
  if (outcomes.length === 0) return []
  const probability = 1 / outcomes.length
  return outcomes.map((value) => [value, probability] as const)
}

/**
 * Constructs a distribution from explicit `(value, weight)` pairs.
 * Pairs with non-positive weights are excluded.
 *
 * **Type shape:**
 *
 * `weighted : ReadonlyArray<readonly [Value, number]> -> Distribution<Value>`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 *
 * Distribution.weighted([[1, 0.5], [2, 0.3], [3, 0.2]])
 * // [[1, 0.5], [2, 0.3], [3, 0.2]]
 */
const weighted = <Value>(
  pairs: ReadonlyArray<readonly [Value, number]>,
): Distribution<Value> =>
  pairs.filter(([, weight]) => weight > 0)

/**
 * Constructs a Bernoulli distribution: `true` with probability `p`,
 * `false` with probability `1 - p`.
 *
 * **Type shape:**
 *
 * `bernoulli : number -> Distribution<boolean>`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 *
 * Distribution.bernoulli(0.7)
 * // [[true, 0.7], [false, 0.3]]
 */
const bernoulli = (probability: number): Distribution<boolean> =>
  [[true, probability], [false, 1 - probability]]

/**
 * Transforms each outcome's value.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Distribution<Value> -> Distribution<Mapped>`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Distribution.uniform([1, 2, 3]),
 *   Distribution.map((n: number) => n * 2),
 * )
 * // [[2, 1/3], [4, 1/3], [6, 1/3]]
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (distribution: Distribution<Value>): Distribution<Mapped> =>
    distribution.map(([value, weight]) => [transform(value), weight] as const)

/**
 * Marginalisation: for each outcome, draw from a dependent distribution
 * and multiply weights.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Distribution<Next>) -> Distribution<Value> -> Distribution<Next>`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // Roll a die; if > 3, flip a coin
 * const die = Distribution.uniform([1, 2, 3, 4, 5, 6])
 * const coin = Distribution.bernoulli(0.5)
 *
 * pipe(
 *   die,
 *   Distribution.chain((roll: number) =>
 *     roll > 3 ? coin : Distribution.of(false)
 *   ),
 *   Distribution.normalize,
 * )
 */
const chain = <Value, Next>(
  next: Unary<Value, Distribution<Next>>,
) =>
  (distribution: Distribution<Value>): Distribution<Next> => {
    const out: Array<readonly [Next, number]> = []
    for (const [value, weight] of distribution) {
      for (const [innerValue, innerWeight] of next(value)) {
        out.push([innerValue, weight * innerWeight] as const)
      }
    }
    return out
  }

/**
 * Computes the probability that a predicate holds, relative to total weight.
 *
 * **Type shape:**
 *
 * `probability : Predicate<Value> -> Distribution<Value> -> number`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 *
 * const die = Distribution.uniform([1, 2, 3, 4, 5, 6])
 *
 * Distribution.probability((n: number) => n > 3)(die) // 0.5
 */
const probability = <Value>(
  predicate: Predicate<Value>,
) =>
  (distribution: Distribution<Value>): number => {
    const total = sumWeights(distribution)
    if (total === 0) return 0
    const matched = sumWeights(
      distribution.filter(([value]) => predicate(value)),
    )
    return matched / total
  }

/**
 * Keeps only outcomes satisfying the predicate and renormalizes.
 *
 * **Type shape:**
 *
 * `condition : Predicate<Value> -> Distribution<Value> -> Distribution<Value>`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // Probability of rolling > 4, given the roll is even
 * pipe(
 *   Distribution.uniform([1, 2, 3, 4, 5, 6]),
 *   Distribution.condition((n: number) => n % 2 === 0),
 *   Distribution.probability((n: number) => n > 4),
 * )
 * // 1/3 (only 6 satisfies both conditions out of [2,4,6])
 */
const condition = <Value>(
  predicate: Predicate<Value>,
) =>
  (distribution: Distribution<Value>): Distribution<Value> =>
    normalize(distribution.filter(([value]) => predicate(value)))

/**
 * Collapses duplicate outcomes and renormalizes weights to sum to 1.
 *
 * The `keyFunction` determines equality — defaults to `JSON.stringify`.
 *
 * **Type shape:**
 *
 * `normalize : (Distribution<Value>, (Value -> string)?) -> Distribution<Value>`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 *
 * Distribution.normalize([[1, 2], [1, 3], [2, 5]])
 * // [[1, 0.5], [2, 0.5]] — duplicate 1s merged, total normalized to 1
 */
const normalize = <Value>(
  distribution: Distribution<Value>,
  keyFunction: Unary<Value, string> = (value) => JSON.stringify(value),
): Distribution<Value> => {
  const merged = new Map<string, { value: Value; weight: number }>()
  for (const [value, weight] of distribution) {
    const key = keyFunction(value)
    const existing = merged.get(key)
    if (existing !== undefined) existing.weight += weight
    else merged.set(key, { value, weight })
  }
  const total = [...merged.values()].reduce(
    (accumulator, entry) => accumulator + entry.weight,
    0,
  )
  if (total === 0) return []
  return [...merged.values()].map(
    (entry) => [entry.value, entry.weight / total] as const,
  )
}

/**
 * Computes the expected value of a numeric distribution.
 *
 * **Type shape:**
 *
 * `expected : Distribution<number> -> number`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 *
 * Distribution.expected(Distribution.uniform([1, 2, 3, 4, 5, 6]))
 * // 3.5
 */
const expected = (distribution: Distribution<number>): number => {
  const total = sumWeights(distribution)
  if (total === 0) return 0
  return distribution.reduce(
    (accumulator, [value, weight]) => accumulator + value * weight,
    0,
  ) / total
}

/**
 * Draws a single sample from the distribution using a random number
 * generator. Returns `null` for an empty distribution.
 *
 * **Type shape:**
 *
 * `sample : (Distribution<Value>, () -> number) -> Value | null`
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 *
 * Distribution.sample(Distribution.uniform([1, 2, 3, 4, 5, 6]))
 * // a random number between 1 and 6
 */
const sample = <Value>(
  distribution: Distribution<Value>,
  randomNumberGenerator: () => number = Math.random,
): Value | null => {
  if (distribution.length === 0) return null
  const total = sumWeights(distribution)
  let pick = randomNumberGenerator() * total
  for (const [value, weight] of distribution) {
    pick -= weight
    if (pick <= 0) return value
  }
  return distribution[distribution.length - 1]![0]
}

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Distribution` monad for finite discrete probability distributions.
 *
 * A `Distribution<Value>` is a list of `(value, weight)` pairs. `chain`
 * models marginalisation. `normalize` collapses duplicates and
 * renormalizes. `probability` and `condition` answer probabilistic queries.
 *
 * @example
 * import { Distribution } from 'heron-ts/monad/distribution'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // What is P(sum > 7) when rolling two fair dice?
 * const die = Distribution.uniform([1, 2, 3, 4, 5, 6])
 *
 * const sumOfTwo = pipe(
 *   die,
 *   Distribution.chain((first: number) =>
 *     pipe(
 *       die,
 *       Distribution.map((second: number) => first + second),
 *     )
 *   ),
 *   Distribution.normalize,
 * )
 *
 * Distribution.probability((sum: number) => sum > 7)(sumOfTwo)
 * // ~0.4167 (15/36)
 */
export const Distribution = {
  of,
  uniform,
  weighted,
  bernoulli,
  map,
  chain,
  probability,
  condition,
  normalize,
  expected,
  sample,
} as const
