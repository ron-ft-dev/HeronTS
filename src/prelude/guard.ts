/**
 * @file     guard.ts
 * @location src/prelude/guard.ts
 * @brief    General-purpose type guard primitives.
 */

import type { Nullable } from './types'

/**
 * Returns `true` if the value is `null`.
 *
 * **Type shape:**
 *
 * `isNull : unknown -> value is null`
 *
 * @example
 * isNull(null)      // true
 * isNull(undefined) // false
 * isNull(0)         // false
 */
export const isNull = (value: unknown): value is null =>
  value === null

/**
 * Returns `true` if the value is `undefined`.
 *
 * **Type shape:**
 *
 * `isUndefined : unknown -> value is undefined`
 *
 * @example
 * isUndefined(undefined) // true
 * isUndefined(null)      // false
 * isUndefined(0)         // false
 */
export const isUndefined = (value: unknown): value is undefined =>
  value === undefined

/**
 * Returns `true` if the value is `null` or `undefined`.
 *
 * **Type shape:**
 *
 * `isNullable : unknown -> value is null | undefined`
 *
 * @example
 * isNullable(null)      // true
 * isNullable(undefined) // true
 * isNullable(0)         // false
 * isNullable('')        // false
 */
export const isNullable = (value: unknown): value is Nullable<never> =>
  value === null || value === undefined

/**
 * Returns `true` if the value is neither `null` nor `undefined`.
 *
 * Narrows the type to `NonNullable<Value>` in the surrounding scope.
 *
 * **Type shape:**
 *
 * `isDefined : Value -> value is NonNullable<Value>`
 *
 * @example
 * isDefined(5)         // true
 * isDefined('')        // true
 * isDefined(false)     // true
 * isDefined(null)      // false
 * isDefined(undefined) // false
 */
export const isDefined = <Value>(
  value: Value,
): value is NonNullable<Value> =>
  value !== null && value !== undefined
