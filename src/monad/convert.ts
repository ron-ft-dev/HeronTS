/**
 * @file     convert.ts
 * @location src/monad/converts.ts
 * @brief    Convert functions between Maybe, Result, and Either.
 *
 * These live in a dedicated file to avoid circular dependencies between
 * the monad modules. Import from here when you need to convert between
 * monad types.
 */

import type { Lazy } from '../prelude/types'
import { Maybe } from './maybe'
import { Result } from './result'
import { Either } from './either'

// ─────────────────────────────────────────────────────────────────────────────
// Maybe convert
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a `Maybe<Value>` into a `Result<Value, Error>` by providing
 * an error for the `None` case.
 *
 * **Type shape:**
 *
 * `maybeToResult : Lazy<Error> -> Maybe<Value> -> Result<Value, Error>`
 *
 * @example
 * import { maybeToResult } from 'heron-ts/monad/convert'
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Maybe.some(5),
 *   maybeToResult(() => 'value was missing'),
 * )
 * // Result.ok(5)
 *
 * pipe(
 *   Maybe.none,
 *   maybeToResult(() => 'value was missing'),
 * )
 * // Result.err('value was missing')
 */
export const maybeToResult = <Value, Error>(
  onNone: Lazy<Error>,
) =>
  (maybe: Maybe<Value>): Result<Value, Error> =>
    maybe._tag === 'Some'
      ? Result.ok(maybe.value)
      : Result.err(onNone())

/**
 * Converts a `Maybe<Value>` into an `Either<Error, Value>` by providing
 * an error for the `None` case.
 *
 * **Type shape:**
 *
 * `maybeToEither : Lazy<Error> -> Maybe<Value> -> Either<Error, Value>`
 *
 * @example
 * import { maybeToEither } from 'heron-ts/monad/convert'
 * import { Maybe } from 'heron-ts/monad/maybe'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Maybe.some(5),
 *   maybeToEither(() => 'value was missing'),
 * )
 * // Either.right(5)
 */
export const maybeToEither = <Value, Error>(
  onNone: Lazy<Error>,
) =>
  (maybe: Maybe<Value>): Either<Error, Value> =>
    maybe._tag === 'Some'
      ? Either.right(maybe.value)
      : Either.left(onNone())

// ─────────────────────────────────────────────────────────────────────────────
// Result convert
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a `Result<Value, Error>` to a `Maybe<Value>`, discarding
 * the error.
 *
 * **Type shape:**
 *
 * `resultToMaybe : Result<Value, Error> -> Maybe<Value>`
 *
 * @example
 * import { resultToMaybe } from 'heron-ts/monad/convert'
 * import { Result } from 'heron-ts/monad/result'
 *
 * resultToMaybe(Result.ok(5))       // Maybe.some(5)
 * resultToMaybe(Result.err('oops')) // Maybe.none
 */
export const resultToMaybe = <Value, Error>(
  result: Result<Value, Error>,
): Maybe<Value> =>
  result._tag === 'Ok' ? Maybe.some(result.value) : Maybe.none

/**
 * Converts a `Result<Value, Error>` into an `Either<Error, Value>`.
 *
 * **Type shape:**
 *
 * `resultToEither : Result<Value, Error> -> Either<Error, Value>`
 *
 * @example
 * import { resultToEither } from 'heron-ts/monad/convert'
 * import { Result } from 'heron-ts/monad/result'
 *
 * resultToEither(Result.ok(5))       // Either.right(5)
 * resultToEither(Result.err('oops')) // Either.left('oops')
 */
export const resultToEither = <Value, Error>(
  result: Result<Value, Error>,
): Either<Error, Value> =>
  result._tag === 'Ok'
    ? Either.right(result.value)
    : Either.left(result.error)

// ─────────────────────────────────────────────────────────────────────────────
// Either convert
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts an `Either<Error, Value>` to a `Maybe<Value>`, discarding
 * the `Left` value.
 *
 * **Type shape:**
 *
 * `eitherToMaybe : Either<Error, Value> -> Maybe<Value>`
 *
 * @example
 * import { eitherToMaybe } from 'heron-ts/monad/convert'
 * import { Either } from 'heron-ts/monad/either'
 *
 * eitherToMaybe(Either.right(5))      // Maybe.some(5)
 * eitherToMaybe(Either.left('oops'))  // Maybe.none
 */
export const eitherToMaybe = <Error, Value>(
  either: Either<Error, Value>,
): Maybe<Value> =>
  either._tag === 'Right' ? Maybe.some(either.value) : Maybe.none

/**
 * Converts an `Either<Error, Value>` into a `Result<Value, Error>`.
 *
 * **Type shape:**
 *
 * `eitherToResult : Either<Error, Value> -> Result<Value, Error>`
 *
 * @example
 * import { eitherToResult } from 'heron-ts/monad/convert'
 * import { Either } from 'heron-ts/monad/either'
 *
 * eitherToResult(Either.right(5))      // Result.ok(5)
 * eitherToResult(Either.left('oops'))  // Result.err('oops')
 */
export const eitherToResult = <Error, Value>(
  either: Either<Error, Value>,
): Result<Value, Error> =>
  either._tag === 'Right'
    ? Result.ok(either.value)
    : Result.err(either.value)

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert functions between `Maybe`, `Result`, and `Either`.
 *
 * Import these when you need to move a value from one monad type to
 * another. They live in a dedicated module to avoid circular dependencies.
 *
 * @example
 * import { Convert } from 'heron-ts/monad/convert'
 * import { Maybe } from 'heron-ts/monad/maybe'
 *
 * Convert.maybeToResult(() => 'missing')(Maybe.some(5))
 * // Result.ok(5)
 */
export const Convert = {
  maybeToResult,
  maybeToEither,
  resultToMaybe,
  resultToEither,
  eitherToMaybe,
  eitherToResult,
} as const
