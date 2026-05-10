/**
 * @file     io.ts
 * @location src/monad/io.ts
 * @brief    The IO monad for explicit, composable synchronous side effects.
 */

import type { Unary, Thunk } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An `IO<Value>` is a lazy synchronous computation that, when executed,
 * performs side effects and produces a `Value`.
 *
 * Construction is pure — building an `IO` does not execute anything.
 * The only place effects actually happen is at `IO.run`. This makes
 * `IO` values safe to pass around, compose, and reuse without triggering
 * unintended side effects.
 *
 * Use `IO` when:
 * - You want to describe a side-effectful computation without running it yet.
 * - You want to compose side effects cleanly with `map` and `chain`.
 * - You want to make it obvious at the type level that something has effects.
 *
 * **Type shape:**
 *
 * `IO<Value> = () -> Value`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 *
 * const greeting: IO<void> = IO.log('Hello, world!')
 *
 * // Nothing has happened yet — greeting is just a description.
 * IO.run(greeting)
 * // logs "Hello, world!"
 */
export type IO<Value> = Thunk<Value>

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into `IO`. The resulting computation has no side
 * effects — it simply returns the value when run.
 *
 * **Type shape:**
 *
 * `of : Value -> IO<Value>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 *
 * IO.run(IO.of(5)) // 5
 */
const of = <Value>(value: Value): IO<Value> => () => value

/**
 * Wraps a thunk in `IO`. The thunk is not called until `IO.run`.
 *
 * **Type shape:**
 *
 * `from : (() -> Value) -> IO<Value>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 *
 * const getTime = IO.from(() => Date.now())
 * IO.run(getTime) // current timestamp
 */
const from = <Value>(thunk: Thunk<Value>): IO<Value> => thunk

/**
 * Executes an `IO` computation and returns the result. This is the only
 * place side effects actually happen.
 *
 * **Type shape:**
 *
 * `run : IO<Value> -> Value`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 *
 * IO.run(IO.of(5))       // 5
 * IO.run(IO.random())    // a random number
 */
const run = <Value>(io: IO<Value>): Value => io()

/**
 * Transforms the value produced by an `IO`.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> IO<Value> -> IO<Mapped>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   IO.from(() => Date.now()),
 *   IO.map((timestamp: number) => new Date(timestamp).toISOString()),
 *   IO.run,
 * )
 * // "2024-01-01T00:00:00.000Z" (current time)
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (io: IO<Value>): IO<Mapped> =>
    () => transform(io())

/**
 * Sequences two `IO` computations. The result of the first is passed to
 * a function that produces the second.
 *
 * **Type shape:**
 *
 * `chain : (Value -> IO<Next>) -> IO<Value> -> IO<Next>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   IO.random(),
 *   IO.chain((n: number) => IO.log(`Random: ${n}`)),
 *   IO.run,
 * )
 * // logs "Random: 0.123..."
 */
const chain = <Value, Next>(
  next: Unary<Value, IO<Next>>,
) =>
  (io: IO<Value>): IO<Next> =>
    () => next(io())()

/**
 * Applies an `IO`-wrapped function to an `IO`-wrapped value.
 *
 * **Type shape:**
 *
 * `apply : IO<(Value -> Mapped)> -> IO<Value> -> IO<Mapped>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   IO.of(5),
 *   IO.apply(IO.of((n: number) => n * 2)),
 * )
 * // IO that produces 10
 */
const apply = <Value, Mapped>(
  ioOfFunction: IO<Unary<Value, Mapped>>,
) =>
  (io: IO<Value>): IO<Mapped> =>
    () => ioOfFunction()(io())

/**
 * Runs a side effect on the produced value, then passes it through unchanged.
 *
 * **Type shape:**
 *
 * `tap : (Value -> void) -> IO<Value> -> IO<Value>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   IO.of(5),
 *   IO.tap((n: number) => console.log(`Value: ${n}`)),
 *   IO.run,
 * )
 * // logs "Value: 5", returns 5
 */
const tap = <Value>(
  sideEffect: Unary<Value, void>,
) =>
  (io: IO<Value>): IO<Value> =>
    () => {
      const value = io()
      sideEffect(value)
      return value
    }

/**
 * Runs two `IO` computations in sequence, ignoring the first's result.
 *
 * **Type shape:**
 *
 * `andThen : IO<Next> -> IO<Value> -> IO<Next>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   IO.log('first'),
 *   IO.andThen(IO.log('second')),
 *   IO.run,
 * )
 * // logs "first", then "second"
 */
const andThen = <Next>(
  next: IO<Next>,
) =>
  <Value>(io: IO<Value>): IO<Next> =>
    () => {
      io()
      return next()
    }

/**
 * Runs a `ReadonlyArray<IO<Value>>` in sequence, collecting all results.
 *
 * **Type shape:**
 *
 * `sequence : ReadonlyArray<IO<Value>> -> IO<ReadonlyArray<Value>>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 *
 * IO.run(IO.sequence([IO.of(1), IO.of(2), IO.of(3)]))
 * // [1, 2, 3]
 */
const sequence = <Value>(
  ios: ReadonlyArray<IO<Value>>,
): IO<ReadonlyArray<Value>> =>
  () => ios.map((io) => io())

/**
 * Logs a message to the console.
 *
 * **Type shape:**
 *
 * `log : unknown -> IO<void>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 *
 * IO.run(IO.log('Hello!')) // logs "Hello!"
 */
const log = (message: unknown): IO<void> =>
  () => console.log(message)

/**
 * Returns the current timestamp as an `IO`.
 *
 * **Type shape:**
 *
 * `now : () -> IO<number>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 *
 * IO.run(IO.now()) // e.g. 1704067200000
 */
const now = (): IO<number> => () => Date.now()

/**
 * Returns a random number between 0 and 1 as an `IO`.
 *
 * **Type shape:**
 *
 * `random : () -> IO<number>`
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 *
 * IO.run(IO.random()) // e.g. 0.7316...
 */
const random = (): IO<number> => () => Math.random()

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `IO` monad for explicit, composable synchronous side effects.
 *
 * An `IO<Value>` is a lazy computation — nothing runs until `IO.run`.
 * This makes effects safe to compose, reuse, and reason about.
 *
 * @example
 * import { IO } from 'heron-ts/monad/io'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const program = pipe(
 *   IO.now(),
 *   IO.map((timestamp: number) => new Date(timestamp).toISOString()),
 *   IO.chain((timestamp: string) => IO.log(`Current time: ${timestamp}`)),
 * )
 *
 * IO.run(program) // logs "Current time: 2024-01-01T00:00:00.000Z"
 */
export const IO = {
  of,
  from,
  run,
  map,
  chain,
  apply,
  tap,
  andThen,
  sequence,
  log,
  now,
  random,
} as const
