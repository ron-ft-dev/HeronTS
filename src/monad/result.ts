/**
 * @file     result.ts
 * @location src/monad/result.ts
 * @brief    The Result monad for explicit, composable error handling.
 */

import type { Unary, Binary, Ternary, Nullable, Lazy, Predicate, Thunk } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Represents a successful computation containing a `Value`.
 *
 * **Type shape:**
 *
 * `Ok<Value> = { _tag: 'Ok', value: Value }`
 */
export type Ok<Value> = {
  readonly _tag: 'Ok'
  readonly value: Value
}

/**
 * Represents a failed computation containing an `Error`.
 *
 * **Type shape:**
 *
 * `Err<Error> = { _tag: 'Err', error: Error }`
 */
export type Err<Error> = {
  readonly _tag: 'Err'
  readonly error: Error
}

/**
 * A `Result<Value, Error>` is a computation that either succeeded with a
 * `Value` or failed with an `Error`.
 *
 * It is either `Ok<Value>` (success) or `Err<Error>` (failure). Unlike
 * thrown exceptions, a `Result` makes the failure case explicit in the
 * type — the compiler forces you to handle both.
 *
 * Use `Result` when:
 * - A computation can fail in a predictable, recoverable way.
 * - You want to chain operations that might fail without nested try/catch.
 * - You want the type system to force error handling at the call site.
 *
 * **Type shape:**
 *
 * `Result<Value, Error> = Ok<Value> | Err<Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * const success: Result<number, string> = Result.ok(5)
 * const failure: Result<number, string> = Result.err('something went wrong')
 *
 * Result.run({
 *   onOk: (value) => `Success: ${value}`,
 *   onErr: (error) => `Failure: ${error}`,
 * })(success)
 * // "Success: 5"
 */
export type Result<Value, Error> = Ok<Value> | Err<Error>

/**
 * The two handlers required to eliminate a `Result<Value, Error>`.
 * Passed to `Result.run` and `Result.fold`.
 *
 * **Type shape:**
 *
 * `ResultHandlers<Value, Error, Outcome> = { onOk: Value -> Outcome, onErr: Error -> Outcome }`
 */
export type ResultHandlers<Value, Error, Outcome> = {
  readonly onOk: Unary<Value, Outcome>
  readonly onErr: Unary<Error, Outcome>
}

// ─────────────────────────────────────────────────────────────────────────────
// Constructors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs an `Ok<Value>` — a successful `Result`.
 *
 * **Type shape:**
 *
 * `ok : Value -> Ok<Value>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * Result.ok(5)       // { _tag: 'Ok', value: 5 }
 * Result.ok('hello') // { _tag: 'Ok', value: 'hello' }
 */
export const ok = <Value>(value: Value): Ok<Value> => ({
  _tag: 'Ok',
  value,
})

/**
 * Constructs an `Err<Error>` — a failed `Result`.
 *
 * **Type shape:**
 *
 * `err : Error -> Err<Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * Result.err('not found') // { _tag: 'Err', error: 'not found' }
 * Result.err(404)         // { _tag: 'Err', error: 404 }
 */
export const err = <Error>(error: Error): Err<Error> => ({
  _tag: 'Err',
  error,
})

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into a `Result`. Equivalent to `ok`.
 *
 * Provided for consistency with the monad protocol — `Result.of` plays
 * the same role as `Maybe.of`, `Continuation.of`, etc.
 *
 * **Type shape:**
 *
 * `of : Value -> Ok<Value>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * Result.of(5) // { _tag: 'Ok', value: 5 }
 */
const of = <Value>(value: Value): Ok<Value> => ok(value)

/**
 * Eliminates a `Result` by providing handlers for both cases.
 *
 * This is the exit point from `Result`-land. You provide two handlers —
 * one for `Ok` and one for `Err` — and get back a plain value.
 *
 * Curried so that handlers can be pre-baked and reused across multiple
 * `Result` values, and so that `run` slots cleanly into `pipe`.
 *
 * **Type shape:**
 *
 * `run : ResultHandlers<Value, Error, Outcome> -> Result<Value, Error> -> Outcome`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const describe = Result.run({
 *   onOk: (value: number) => `Success: ${value}`,
 *   onErr: (error: string) => `Failure: ${error}`,
 * })
 *
 * describe(Result.ok(5))            // "Success: 5"
 * describe(Result.err('not found')) // "Failure: not found"
 */
const run = <Value, Error, Outcome>(
  handlers: ResultHandlers<Value, Error, Outcome>,
) =>
  (result: Result<Value, Error>): Outcome =>
    result._tag === 'Ok'
      ? handlers.onOk(result.value)
      : handlers.onErr(result.error)

/**
 * Alias for `run`. Provided for familiarity with Scala/cats conventions.
 *
 * **Type shape:**
 *
 * `fold : ResultHandlers<Value, Error, Outcome> -> Result<Value, Error> -> Outcome`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * Result.fold({
 *   onOk: (value: number) => `Success: ${value}`,
 *   onErr: (error: string) => `Failure: ${error}`,
 * })(Result.ok(5))
 * // "Success: 5"
 */
const fold = run

/**
 * Transforms the value inside an `Ok`. No-op if `Err`.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Result<Value, Error> -> Result<Mapped, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Result.ok(5),
 *   Result.map((value: number) => value * 2),
 * )
 * // Result.ok(10)
 *
 * pipe(
 *   Result.err('failed'),
 *   Result.map((value: number) => value * 2),
 * )
 * // Result.err('failed')
 */
const map = <Value, Mapped, Error>(
  transform: Unary<Value, Mapped>,
) =>
  (result: Result<Value, Error>): Result<Mapped, Error> =>
    result._tag === 'Ok'
      ? ok(transform(result.value))
      : err(result.error)

/**
 * Transforms the error inside an `Err`. No-op if `Ok`.
 *
 * **Type shape:**
 *
 * `mapError : (Error -> MappedError) -> Result<Value, Error> -> Result<Value, MappedError>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Result.err(404),
 *   Result.mapError((code: number) => `HTTP error: ${code}`),
 * )
 * // Result.err('HTTP error: 404')
 */
const mapError = <Value, Error, MappedError>(
  transform: Unary<Error, MappedError>,
) =>
  (result: Result<Value, Error>): Result<Value, MappedError> =>
    result._tag === 'Err'
      ? err(transform(result.error))
      : ok(result.value)

/**
 * Sequences two `Result` computations. No-op if `Err`.
 *
 * Use `chain` when the transformation function itself returns a `Result`.
 * If it returns a plain value, use `map` instead.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Result<Next, Error>) -> Result<Value, Error> -> Result<Next, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const safeDivide = (divisor: number) =>
 *   (value: number): Result<number, string> =>
 *     divisor === 0
 *       ? Result.err('division by zero')
 *       : Result.ok(value / divisor)
 *
 * pipe(
 *   Result.ok(10),
 *   Result.chain(safeDivide(2)),
 * )
 * // Result.ok(5)
 *
 * pipe(
 *   Result.ok(10),
 *   Result.chain(safeDivide(0)),
 * )
 * // Result.err('division by zero')
 */
const chain = <Value, Next, Error>(
  next: Unary<Value, Result<Next, Error>>,
) =>
  (result: Result<Value, Error>): Result<Next, Error> =>
    result._tag === 'Ok'
      ? next(result.value)
      : err(result.error)

/**
 * Sequences on the error rail. No-op if `Ok`.
 *
 * The mirror of `chain` — lets you recover from an `Err` by producing
 * a new `Result`.
 *
 * **Type shape:**
 *
 * `chainError : (Error -> Result<Value, MappedError>) -> Result<Value, Error> -> Result<Value, MappedError>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const retry = (error: string): Result<number, string> =>
 *   error === 'timeout' ? Result.ok(0) : Result.err(error)
 *
 * pipe(
 *   Result.err('timeout'),
 *   Result.chainError(retry),
 * )
 * // Result.ok(0)
 */
const chainError = <Value, Error, MappedError>(
  next: Unary<Error, Result<Value, MappedError>>,
) =>
  (result: Result<Value, Error>): Result<Value, MappedError> =>
    result._tag === 'Err'
      ? next(result.error)
      : ok(result.value)

/**
 * Applies a `Result`-wrapped function to a `Result`-wrapped value.
 * Produces the first `Err` encountered if either side is `Err`.
 *
 * **Type shape:**
 *
 * `apply : Result<(Value -> Mapped), Error> -> Result<Value, Error> -> Result<Mapped, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const transform = Result.ok((n: number) => n * 2)
 *
 * pipe(
 *   Result.ok(5),
 *   Result.apply(transform),
 * )
 * // Result.ok(10)
 */
const apply = <Value, Mapped, Error>(
  resultOfFunction: Result<Unary<Value, Mapped>, Error>,
) =>
  (result: Result<Value, Error>): Result<Mapped, Error> =>
    resultOfFunction._tag === 'Ok' && result._tag === 'Ok'
      ? ok(resultOfFunction.value(result.value))
      : resultOfFunction._tag === 'Err'
        ? err(resultOfFunction.error)
        : err((result as Err<Error>).error)

/**
 * Lifts a binary function to work on two `Result` values. Produces the
 * first `Err` encountered if either input is `Err`.
 *
 * **Type shape:**
 *
 * `lift2 : ((A, B) -> C) -> Result<A, Error> -> Result<B, Error> -> Result<C, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * const add = (a: number, b: number): number => a + b
 *
 * Result.lift2(add)(Result.ok(3))(Result.ok(4))        // Result.ok(7)
 * Result.lift2(add)(Result.err('oops'))(Result.ok(4))  // Result.err('oops')
 */
const lift2 = <A, B, C, Error>(
  fn: Binary<A, B, C>,
) =>
  (resultA: Result<A, Error>) =>
    (resultB: Result<B, Error>): Result<C, Error> =>
      resultA._tag === 'Ok' && resultB._tag === 'Ok'
        ? ok(fn(resultA.value, resultB.value))
        : resultA._tag === 'Err'
          ? err(resultA.error)
          : err((resultB as Err<Error>).error)

/**
 * Lifts a ternary function to work on three `Result` values. Produces
 * the first `Err` encountered if any input is `Err`.
 *
 * **Type shape:**
 *
 * `lift3 : ((A, B, C) -> D) -> Result<A, Error> -> Result<B, Error> -> Result<C, Error> -> Result<D, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * const addThree = (a: number, b: number, c: number): number => a + b + c
 *
 * Result.lift3(addThree)(Result.ok(1))(Result.ok(2))(Result.ok(3))
 * // Result.ok(6)
 *
 * Result.lift3(addThree)(Result.ok(1))(Result.err('oops'))(Result.ok(3))
 * // Result.err('oops')
 */
const lift3 = <A, B, C, D, Error>(
  fn: Ternary<A, B, C, D>,
) =>
  (resultA: Result<A, Error>) =>
    (resultB: Result<B, Error>) =>
      (resultC: Result<C, Error>): Result<D, Error> =>
        resultA._tag === 'Ok' &&
        resultB._tag === 'Ok' &&
        resultC._tag === 'Ok'
          ? ok(fn(resultA.value, resultB.value, resultC.value))
          : resultA._tag === 'Err'
            ? err(resultA.error)
            : resultB._tag === 'Err'
              ? err(resultB.error)
              : err((resultC as Err<Error>).error)

/**
 * Provides a fallback `Result` if the current one is `Err`.
 *
 * Unlike `getOrElse`, the fallback is itself a `Result` — useful when
 * the recovery computation might also fail.
 *
 * **Type shape:**
 *
 * `orElse : (Error -> Result<Value, MappedError>) -> Result<Value, Error> -> Result<Value, MappedError>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Result.err('timeout'),
 *   Result.orElse((error: string) => Result.ok(0)),
 * )
 * // Result.ok(0)
 *
 * pipe(
 *   Result.ok(5),
 *   Result.orElse((error: string) => Result.ok(0)),
 * )
 * // Result.ok(5)
 */
const orElse = <Value, Error, MappedError>(
  fallback: Unary<Error, Result<Value, MappedError>>,
) =>
  (result: Result<Value, Error>): Result<Value, MappedError> =>
    result._tag === 'Err'
      ? fallback(result.error)
      : ok(result.value)

/**
 * Keeps the `Ok` value if it satisfies the predicate, otherwise produces
 * an `Err` using the provided error producer.
 *
 * **Type shape:**
 *
 * `filter : (Predicate<Value>, Lazy<Error>) -> Result<Value, Error> -> Result<Value, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Result.ok(5),
 *   Result.filter(
 *     (value: number) => value > 3,
 *     () => 'value too small',
 *   ),
 * )
 * // Result.ok(5)
 *
 * pipe(
 *   Result.ok(2),
 *   Result.filter(
 *     (value: number) => value > 3,
 *     () => 'value too small',
 *   ),
 * )
 * // Result.err('value too small')
 */
const filter = <Value, Error>(
  predicate: Predicate<Value>,
  onFail: Lazy<Error>,
) =>
  (result: Result<Value, Error>): Result<Value, Error> =>
    result._tag === 'Ok' && !predicate(result.value)
      ? err(onFail())
      : result._tag === 'Ok'
        ? ok(result.value)
        : err(result.error)

/**
 * Runs a side-effecting function on the `Ok` value, then passes the
 * original `Result` through unchanged.
 *
 * **Type shape:**
 *
 * `tap : (Value -> void) -> Result<Value, Error> -> Result<Value, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Result.ok(5),
 *   Result.tap((value) => console.log(`Value: ${value}`)),
 *   Result.map((value: number) => value * 2),
 * )
 * // logs "Value: 5", produces Result.ok(10)
 */
const tap = <Value, Error>(
  sideEffect: Unary<Value, void>,
) =>
  (result: Result<Value, Error>): Result<Value, Error> => {
    if (result._tag === 'Ok') sideEffect(result.value)
    return result
  }

/**
 * Runs a side-effecting function on the `Err` value, then passes the
 * original `Result` through unchanged.
 *
 * **Type shape:**
 *
 * `tapError : (Error -> void) -> Result<Value, Error> -> Result<Value, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Result.err('something failed'),
 *   Result.tapError((error) => console.error(`Error: ${error}`)),
 * )
 * // logs "Error: something failed", produces Result.err('something failed')
 */
const tapError = <Value, Error>(
  sideEffect: Unary<Error, void>,
) =>
  (result: Result<Value, Error>): Result<Value, Error> => {
    if (result._tag === 'Err') sideEffect(result.error)
    return result
  }

/**
 * Converts a `Nullable<Value>` into a `Result<Value, Error>`.
 *
 * `null` and `undefined` become `Err`; all other values become `Ok`.
 *
 * **Type shape:**
 *
 * `fromNullable : Lazy<Error> -> Nullable<Value> -> Result<Value, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * Result.fromNullable(() => 'not found')(5)         // Result.ok(5)
 * Result.fromNullable(() => 'not found')(null)      // Result.err('not found')
 * Result.fromNullable(() => 'not found')(undefined) // Result.err('not found')
 */
const fromNullable = <Value, Error>(
  onNullable: Lazy<Error>,
) =>
  (value: Nullable<Value>): Result<Value, Error> =>
    value != null ? ok(value) : err(onNullable())

/**
 * Runs a possibly-throwing function and captures any thrown value as
 * an `Err`.
 *
 * **Type shape:**
 *
 * `tryCatch : (Thunk<Value>, unknown -> Error) -> Result<Value, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * Result.tryCatch(() => JSON.parse('{"n":5}'))
 * // Result.ok({ n: 5 })
 *
 * Result.tryCatch(
 *   () => JSON.parse('invalid json'),
 *   (error) => `Parse failed: ${error}`,
 * )
 * // Result.err('Parse failed: SyntaxError: ...')
 */
const tryCatch = <Value, Error = unknown>(
  thunk: Thunk<Value>,
  onThrow: Unary<unknown, Error> = (caught) => caught as Error,
): Result<Value, Error> => {
  try {
    return ok(thunk())
  } catch (caught) {
    return err(onThrow(caught))
  }
}

/**
 * Runs a possibly-throwing async function and captures any thrown value
 * as an `Err`. The async equivalent of `tryCatch`.
 *
 * **Type shape:**
 *
 * `tryCatchAsync : (Thunk<Promise<Value>>, unknown -> Error) -> Promise<Result<Value, Error>>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * await Result.tryCatchAsync(
 *   () => fetch('/api').then((r) => r.json()),
 * )
 * // Result.ok({ ... }) on success
 * // Result.err(error) on network failure
 */
const tryCatchAsync = async <Value, Error = unknown>(
  thunk: Thunk<Promise<Value>>,
  onThrow: Unary<unknown, Error> = (caught) => caught as Error,
): Promise<Result<Value, Error>> => {
  try {
    return ok(await thunk())
  } catch (caught) {
    return err(onThrow(caught))
  }
}

/**
 * Extracts the `Ok` value, or returns a fallback produced from the
 * `Err` value.
 *
 * **Type shape:**
 *
 * `getOrElse : (Error -> Value) -> Result<Value, Error> -> Value`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(Result.ok(5), Result.getOrElse(() => 0))            // 5
 * pipe(Result.err('not found'), Result.getOrElse(() => 0)) // 0
 */
const getOrElse = <Value, Error>(
  fallback: Unary<Error, Value>,
) =>
  (result: Result<Value, Error>): Value =>
    result._tag === 'Ok'
      ? result.value
      : fallback(result.error)

/**
 * Converts a `ReadonlyArray<Result<Value, Error>>` into a
 * `Result<ReadonlyArray<Value>, Error>`. Stops on the first `Err`.
 *
 * **Type shape:**
 *
 * `sequence : ReadonlyArray<Result<Value, Error>> -> Result<ReadonlyArray<Value>, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * Result.sequence([Result.ok(1), Result.ok(2), Result.ok(3)])
 * // Result.ok([1, 2, 3])
 *
 * Result.sequence([Result.ok(1), Result.err('oops'), Result.ok(3)])
 * // Result.err('oops')
 */
const sequence = <Value, Error>(
  results: ReadonlyArray<Result<Value, Error>>,
): Result<ReadonlyArray<Value>, Error> => {
  const values: Array<Value> = []
  for (const result of results) {
    if (result._tag === 'Err') return result
    values.push(result.value)
  }
  return ok(values)
}

/**
 * Maps over an array with a function that returns a `Result`, then
 * sequences the results. Stops on the first `Err`.
 *
 * **Type shape:**
 *
 * `traverse : (Value -> Result<Mapped, Error>) -> ReadonlyArray<Value> -> Result<ReadonlyArray<Mapped>, Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * const parseNumber = (s: string): Result<number, string> =>
 *   isNaN(Number(s))
 *     ? Result.err(`'${s}' is not a number`)
 *     : Result.ok(Number(s))
 *
 * Result.traverse(parseNumber)(['1', '2', '3'])
 * // Result.ok([1, 2, 3])
 *
 * Result.traverse(parseNumber)(['1', 'oops', '3'])
 * // Result.err("'oops' is not a number")
 */
const traverse = <Value, Mapped, Error>(
  fn: Unary<Value, Result<Mapped, Error>>,
) =>
  (values: ReadonlyArray<Value>): Result<ReadonlyArray<Mapped>, Error> => {
    const mapped: Array<Mapped> = []
    for (const value of values) {
      const result = fn(value)
      if (result._tag === 'Err') return result
      mapped.push(result.value)
    }
    return ok(mapped)
  }

/**
 * Splits a `ReadonlyArray<Result<Value, Error>>` into all `Ok` values
 * and all `Err` values. Unlike `sequence`, collects everything rather
 * than stopping on the first `Err`.
 *
 * **Type shape:**
 *
 * `partition : ReadonlyArray<Result<Value, Error>> -> { oks: ReadonlyArray<Value>, errs: ReadonlyArray<Error> }`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * Result.partition([
 *   Result.ok(1),
 *   Result.err('oops'),
 *   Result.ok(3),
 *   Result.err('again'),
 * ])
 * // { oks: [1, 3], errs: ['oops', 'again'] }
 */
const partition = <Value, Error>(
  results: ReadonlyArray<Result<Value, Error>>,
): {
  readonly oks: ReadonlyArray<Value>
  readonly errs: ReadonlyArray<Error>
} => {
  const oks: Array<Value> = []
  const errs: Array<Error> = []
  for (const result of results) {
    if (result._tag === 'Ok') oks.push(result.value)
    else errs.push(result.error)
  }
  return { oks, errs }
}

/**
 * Swaps the rails: `Ok` becomes `Err`, `Err` becomes `Ok`.
 *
 * **Type shape:**
 *
 * `swap : Result<Value, Error> -> Result<Error, Value>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * Result.swap(Result.ok(5))       // Result.err(5)
 * Result.swap(Result.err('oops')) // Result.ok('oops')
 */
const swap = <Value, Error>(
  result: Result<Value, Error>,
): Result<Error, Value> =>
  result._tag === 'Ok'
    ? err(result.value)
    : ok(result.error)

/**
 * Returns `true` if the `Result` is `Ok`.
 *
 * Narrows the type to `Ok<Value>` in the surrounding scope.
 *
 * **Type shape:**
 *
 * `isOk : Result<Value, Error> -> result is Ok<Value>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * const value: Result<number, string> = Result.ok(5)
 *
 * if (Result.isOk(value)) {
 *   value.value // 5 — narrowed to Ok<number>
 * }
 */
const isOk = <Value, Error>(
  result: Result<Value, Error>,
): result is Ok<Value> =>
  result._tag === 'Ok'

/**
 * Returns `true` if the `Result` is `Err`.
 *
 * Narrows the type to `Err<Error>` in the surrounding scope.
 *
 * **Type shape:**
 *
 * `isErr : Result<Value, Error> -> result is Err<Error>`
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 *
 * const value: Result<number, string> = Result.err('oops')
 *
 * if (Result.isErr(value)) {
 *   value.error // 'oops' — narrowed to Err<string>
 * }
 */
const isErr = <Value, Error>(
  result: Result<Value, Error>,
): result is Err<Error> =>
  result._tag === 'Err'

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Result` monad for explicit, composable error handling.
 *
 * A `Result<Value, Error>` is either `Ok<Value>` (success) or
 * `Err<Error>` (failure). Unlike thrown exceptions, failure is encoded
 * in the type — the compiler forces you to handle both cases.
 *
 * @example
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const safeDivide = (divisor: number) =>
 *   (value: number): Result<number, string> =>
 *     divisor === 0
 *       ? Result.err('division by zero')
 *       : Result.ok(value / divisor)
 *
 * pipe(
 *   Result.ok(10),
 *   Result.chain(safeDivide(2)),
 *   Result.map((value: number) => `Result: ${value}`),
 *   Result.run({
 *     onOk: (value: string) => value,
 *     onErr: (error: string) => `Error: ${error}`,
 *   }),
 * )
 * // "Result: 5"
 */
export const Result = {
  of,
  ok,
  err,
  run,
  fold,
  map,
  mapError,
  chain,
  chainError,
  apply,
  lift2,
  lift3,
  orElse,
  filter,
  tap,
  tapError,
  fromNullable,
  tryCatch,
  tryCatchAsync,
  getOrElse,
  sequence,
  traverse,
  partition,
  swap,
  isOk,
  isErr,
} as const
