/**
 * @file     writer.ts
 * @location src/monad/writer.ts
 * @brief    The Writer monad for computations that accumulate a log.
 */

import type { Unary } from '../prelude/types'
import type { Monoid } from '../prelude/monoid'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A `Writer<Log, Value>` is a pair of an accumulated `Log` and a produced
 * `Value`. The `Log` must form a `Monoid` — it needs an empty value and
 * an associative append operation so log entries can be combined.
 *
 * At each step, the new log entry is appended to the running total using
 * the monoid's `concat`. At the start, the log is initialized to
 * `empty`.
 *
 * Use `Writer` when:
 * - You want to accumulate a log, audit trail, or set of warnings
 *   alongside a computation.
 * - You want the accumulation to be composable and pure.
 *
 * **Type shape:**
 *
 * `Writer<Log, Value> = readonly [Log, Value]`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 * import { stringMonoid } from 'heron-ts/prelude'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Writer.of(stringMonoid)(5),
 *   Writer.chain(stringMonoid)((n: number) =>
 *     Writer.writer(`doubled ${n} to ${n * 2}; `, n * 2)
 *   ),
 *   Writer.chain(stringMonoid)((n: number) =>
 *     Writer.writer(`added 1 to ${n}; `, n + 1)
 *   ),
 * )
 * // ['doubled 5 to 10; added 1 to 10; ', 11]
 */
export type Writer<Log, Value> = readonly [Log, Value]

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into `Writer`. The log is initialized to the
 * monoid's `empty`.
 *
 * **Type shape:**
 *
 * `of : Monoid<Log> -> Value -> Writer<Log, Value>`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 * import { stringMonoid } from 'heron-ts/prelude'
 *
 * Writer.of(stringMonoid)(5) // ['', 5]
 */
const of = <Log>(monoid: Monoid<Log>) =>
  <Value>(value: Value): Writer<Log, Value> =>
    [monoid.empty, value]

/**
 * Constructs a `Writer` from an explicit log entry and value.
 *
 * **Type shape:**
 *
 * `writer : (Log, Value) -> Writer<Log, Value>`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 *
 * Writer.writer('hello ', 5) // ['hello ', 5]
 */
const writer = <Log, Value>(
  log: Log,
  value: Value,
): Writer<Log, Value> =>
  [log, value]

/**
 * Constructs a `Writer` that records a log entry and produces `undefined`.
 * Useful for logging without a meaningful return value.
 *
 * **Type shape:**
 *
 * `tell : Log -> Writer<Log, void>`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 *
 * Writer.tell('something happened') // ['something happened', undefined]
 */
const tell = <Log>(log: Log): Writer<Log, void> =>
  [log, undefined]

/**
 * Executes a `Writer` by returning both the accumulated log and the
 * produced value.
 *
 * **Type shape:**
 *
 * `run : Writer<Log, Value> -> readonly [Log, Value]`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 * import { stringMonoid } from 'heron-ts/prelude'
 *
 * Writer.run(Writer.of(stringMonoid)(5)) // ['', 5]
 */
const run = <Log, Value>(
  instance: Writer<Log, Value>,
): readonly [Log, Value] =>
  instance

/**
 * Extracts the produced value from a `Writer`.
 *
 * **Type shape:**
 *
 * `getValue : Writer<Log, Value> -> Value`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 *
 * Writer.getValue(Writer.writer('log entry', 42)) // 42
 */
const getValue = <Log, Value>(
  instance: Writer<Log, Value>,
): Value =>
  instance[1]

/**
 * Extracts the accumulated log from a `Writer`.
 *
 * **Type shape:**
 *
 * `getLog : Writer<Log, Value> -> Log`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 *
 * Writer.getLog(Writer.writer('log entry', 42)) // 'log entry'
 */
const getLog = <Log, Value>(
  instance: Writer<Log, Value>,
): Log =>
  instance[0]

/**
 * Transforms the produced value without changing the accumulated log.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Writer<Log, Value> -> Writer<Log, Mapped>`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 * import { stringMonoid } from 'heron-ts/prelude'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Writer.writer('entry; ', 5),
 *   Writer.map((n: number) => n * 2),
 * )
 * // ['entry; ', 10]
 */
const map = <Log, Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (instance: Writer<Log, Value>): Writer<Log, Mapped> =>
    [instance[0], transform(instance[1])]

/**
 * Sequences two `Writer` computations, appending their logs using the
 * monoid's `concat`.
 *
 * **Type shape:**
 *
 * `chain : Monoid<Log> -> (Value -> Writer<Log, Next>) -> Writer<Log, Value> -> Writer<Log, Next>`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 * import { stringMonoid } from 'heron-ts/prelude'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Writer.writer('step 1; ', 5),
 *   Writer.chain(stringMonoid)((n: number) =>
 *     Writer.writer('step 2; ', n * 2)
 *   ),
 * )
 * // ['step 1; step 2; ', 10]
 */
const chain = <Log>(monoid: Monoid<Log>) =>
  <Value, Next>(next: Unary<Value, Writer<Log, Next>>) =>
    (instance: Writer<Log, Value>): Writer<Log, Next> => {
      const [innerLog, innerValue] = next(instance[1])
      return [monoid.concat(instance[0], innerLog), innerValue]
    }

/**
 * Applies a `Writer`-wrapped function to a `Writer`-wrapped value,
 * appending both logs.
 *
 * **Type shape:**
 *
 * `apply : Monoid<Log> -> Writer<Log, (Value -> Mapped)> -> Writer<Log, Value> -> Writer<Log, Mapped>`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 * import { stringMonoid } from 'heron-ts/prelude'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Writer.writer('value; ', 5),
 *   Writer.apply(stringMonoid)(
 *     Writer.writer('fn; ', (n: number) => n * 2),
 *   ),
 * )
 * // ['fn; value; ', 10]
 */
const apply = <Log>(monoid: Monoid<Log>) =>
  <Value, Mapped>(writerOfFunction: Writer<Log, Unary<Value, Mapped>>) =>
    (instance: Writer<Log, Value>): Writer<Log, Mapped> =>
      [
        monoid.concat(writerOfFunction[0], instance[0]),
        writerOfFunction[1](instance[1]),
      ]

/**
 * Modifies the accumulated log without touching the value.
 *
 * **Type shape:**
 *
 * `censor : (Log -> Log) -> Writer<Log, Value> -> Writer<Log, Value>`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 *
 * Writer.censor((log: string) => log.toUpperCase())(
 *   Writer.writer('hello world', 5),
 * )
 * // ['HELLO WORLD', 5]
 */
const censor = <Log>(
  transform: Unary<Log, Log>,
) =>
  <Value>(instance: Writer<Log, Value>): Writer<Log, Value> =>
    [transform(instance[0]), instance[1]]

/**
 * Exposes the current log as part of the produced value, while
 * leaving the log itself unchanged.
 *
 * **Type shape:**
 *
 * `listen : Writer<Log, Value> -> Writer<Log, readonly [Log, Value]>`
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 *
 * Writer.listen(Writer.writer('my log', 5))
 * // ['my log', ['my log', 5]]
 */
const listen = <Log, Value>(
  instance: Writer<Log, Value>,
): Writer<Log, readonly [Log, Value]> =>
  [instance[0], [instance[0], instance[1]]]

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Writer` monad for computations that accumulate a log alongside
 * a produced value.
 *
 * A `Writer<Log, Value>` is a pair `[Log, Value]`. The `Log` must be a
 * `Monoid` — it needs an empty value and an associative append so log
 * entries can be combined.
 *
 * @example
 * import { Writer } from 'heron-ts/monad/writer'
 * import { stringMonoid } from 'heron-ts/prelude'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const divide = (divisor: number) => (value: number): Writer<string, number> =>
 *   Writer.writer(`divided ${value} by ${divisor}; `, value / divisor)
 *
 * pipe(
 *   Writer.of(stringMonoid)(100),
 *   Writer.chain(stringMonoid)(divide(2)),
 *   Writer.chain(stringMonoid)(divide(5)),
 *   Writer.run,
 * )
 * // ['divided 100 by 2; divided 50 by 5; ', 10]
 */
export const Writer = {
  of,
  writer,
  tell,
  run,
  getValue,
  getLog,
  map,
  chain,
  apply,
  censor,
  listen,
} as const
