/**
 * @file     task.ts
 * @location src/monad/task.ts
 * @brief    The Task monad for lazy asynchronous computations.
 */

import type { Unary, Thunk } from '../prelude/types'
import type { Result } from './result'
import { ok, err } from './result'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A `Task<Value>` is a lazy asynchronous computation: a thunk that,
 * when called, returns a `Promise<Value>`. Nothing runs until you call
 * `Task.run`.
 *
 * Unlike a `Promise`, a `Task` does not start executing immediately on
 * construction. This makes `Task` values safe to describe, compose, and
 * pass around without triggering side effects prematurely.
 *
 * For async computations that can fail with a typed error, use
 * `Task.attempt` to convert a `Task<Value>` into a
 * `Task<Result<Value, Error>>`.
 *
 * **Type shape:**
 *
 * `Task<Value> = () -> Promise<Value>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 *
 * const fetchUser = Task.from(() => fetch('/api/user').then((r) => r.json()))
 *
 * // Nothing has happened yet — fetchUser is a description.
 * const user = await Task.run(fetchUser)
 */
export type Task<Value> = Thunk<Promise<Value>>

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into `Task`. The resulting task resolves
 * immediately with the value when run.
 *
 * **Type shape:**
 *
 * `of : Value -> Task<Value>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 *
 * await Task.run(Task.of(42)) // 42
 */
const of = <Value>(value: Value): Task<Value> =>
  () => Promise.resolve(value)

/**
 * Wraps a thunk returning a `Promise` into a `Task`. The thunk is not
 * called until `Task.run`.
 *
 * **Type shape:**
 *
 * `from : (() -> Promise<Value>) -> Task<Value>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 *
 * const fetchData = Task.from(() => fetch('/api').then((r) => r.json()))
 * await Task.run(fetchData)
 */
const from = <Value>(
  thunk: Thunk<Promise<Value>>,
): Task<Value> => thunk

/**
 * Executes a `Task` and returns its `Promise`. This is the only place
 * the async computation actually starts.
 *
 * **Type shape:**
 *
 * `run : Task<Value> -> Promise<Value>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 *
 * await Task.run(Task.of(42)) // 42
 */
const run = <Value>(task: Task<Value>): Promise<Value> => task()

/**
 * Transforms the value produced by a `Task`.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Task<Value> -> Task<Mapped>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 * import { pipe } from 'heron-ts/prelude'
 *
 * await pipe(
 *   Task.of(5),
 *   Task.map((n: number) => n * 2),
 *   Task.run,
 * )
 * // 10
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (task: Task<Value>): Task<Mapped> =>
    () => task().then(transform)

/**
 * Sequences two `Task` computations. The result of the first is passed
 * to a function that produces the second.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Task<Next>) -> Task<Value> -> Task<Next>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 * import { pipe } from 'heron-ts/prelude'
 *
 * await pipe(
 *   Task.of(5),
 *   Task.chain((n: number) => Task.of(n * 2)),
 *   Task.run,
 * )
 * // 10
 */
const chain = <Value, Next>(
  next: Unary<Value, Task<Next>>,
) =>
  (task: Task<Value>): Task<Next> =>
    () => task().then((value) => next(value)())

/**
 * Applies a `Task`-wrapped function to a `Task`-wrapped value.
 * Both tasks run concurrently.
 *
 * **Type shape:**
 *
 * `apply : Task<(Value -> Mapped)> -> Task<Value> -> Task<Mapped>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 * import { pipe } from 'heron-ts/prelude'
 *
 * await pipe(
 *   Task.of(5),
 *   Task.apply(Task.of((n: number) => n * 2)),
 *   Task.run,
 * )
 * // 10
 */
const apply = <Value, Mapped>(
  taskOfFunction: Task<Unary<Value, Mapped>>,
) =>
  (task: Task<Value>): Task<Mapped> =>
    () =>
      Promise.all([taskOfFunction(), task()]).then(
        ([transform, value]) => transform(value),
      )

/**
 * Runs a side effect on the resolved value, then passes it through
 * unchanged.
 *
 * **Type shape:**
 *
 * `tap : (Value -> void | Promise<void>) -> Task<Value> -> Task<Value>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 * import { pipe } from 'heron-ts/prelude'
 *
 * await pipe(
 *   Task.of(5),
 *   Task.tap((n: number) => console.log(`Value: ${n}`)),
 *   Task.run,
 * )
 * // logs "Value: 5", resolves to 5
 */
const tap = <Value>(
  sideEffect: Unary<Value, void | Promise<void>>,
) =>
  (task: Task<Value>): Task<Value> =>
    async () => {
      const value = await task()
      await sideEffect(value)
      return value
    }

/**
 * Produces a `Task` that resolves after `ms` milliseconds.
 *
 * **Type shape:**
 *
 * `delay : number -> Task<void>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 *
 * await Task.run(Task.delay(1000)) // waits 1 second
 */
const delay = (ms: number): Task<void> =>
  () => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Runs a `ReadonlyArray<Task<Value>>` in sequence, one after another,
 * collecting all results.
 *
 * **Type shape:**
 *
 * `sequence : ReadonlyArray<Task<Value>> -> Task<ReadonlyArray<Value>>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 *
 * await Task.run(Task.sequence([Task.of(1), Task.of(2), Task.of(3)]))
 * // [1, 2, 3]
 */
const sequence = <Value>(
  tasks: ReadonlyArray<Task<Value>>,
): Task<ReadonlyArray<Value>> =>
  async () => {
    const out: Array<Value> = []
    for (const task of tasks) out.push(await task())
    return out
  }

/**
 * Runs a `ReadonlyArray<Task<Value>>` concurrently and collects all
 * results.
 *
 * **Type shape:**
 *
 * `parallel : ReadonlyArray<Task<Value>> -> Task<ReadonlyArray<Value>>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 *
 * await Task.run(Task.parallel([Task.of(1), Task.of(2), Task.of(3)]))
 * // [1, 2, 3] (all run concurrently)
 */
const parallel = <Value>(
  tasks: ReadonlyArray<Task<Value>>,
): Task<ReadonlyArray<Value>> =>
  () => Promise.all(tasks.map((task) => task()))

/**
 * Races a `ReadonlyArray<Task<Value>>` concurrently and resolves with
 * the first to complete.
 *
 * **Type shape:**
 *
 * `race : ReadonlyArray<Task<Value>> -> Task<Value>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 *
 * await Task.run(Task.race([
 *   Task.from(() => new Promise((r) => setTimeout(() => r(1), 100))),
 *   Task.from(() => new Promise((r) => setTimeout(() => r(2), 50))),
 * ]))
 * // 2 — the faster task wins
 */
const race = <Value>(
  tasks: ReadonlyArray<Task<Value>>,
): Task<Value> =>
  () => Promise.race(tasks.map((task) => task()))

/**
 * Wraps a `Task` to catch thrown errors, converting them to a
 * `Result`-typed `Task`. Use this to bring error handling into the
 * type system.
 *
 * **Type shape:**
 *
 * `attempt : (Task<Value>, unknown -> Error) -> Task<Result<Value, Error>>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 * import { Result } from 'heron-ts/monad/result'
 *
 * const safeTask = Task.attempt(
 *   Task.from(() => fetch('/api').then((r) => r.json())),
 *   (error) => `Network error: ${error}`,
 * )
 *
 * await Task.run(safeTask)
 * // Result.ok({ ... }) on success
 * // Result.err('Network error: ...') on failure
 */
const attempt = <Value, Error = unknown>(
  task: Task<Value>,
  onThrow: Unary<unknown, Error> = (caught) => caught as Error,
): Task<Result<Value, Error>> =>
  async () => {
    try {
      return ok(await task())
    } catch (caught) {
      return err(onThrow(caught))
    }
  }

/**
 * Lifts a `Result` into a `Task`. `Ok` resolves; `Err` rejects.
 *
 * **Type shape:**
 *
 * `fromResult : Result<Value, Error> -> Task<Value>`
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 * import { Result } from 'heron-ts/monad/result'
 *
 * await Task.run(Task.fromResult(Result.ok(42)))   // 42
 * await Task.run(Task.fromResult(Result.err('!'))) // throws '!'
 */
const fromResult = <Value, Error>(
  result: Result<Value, Error>,
): Task<Value> =>
  result._tag === 'Ok'
    ? of(result.value)
    : () => Promise.reject(result.error)

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Task` monad for lazy asynchronous computations.
 *
 * A `Task<Value>` is a thunk returning a `Promise<Value>`. Nothing runs
 * until `Task.run`. Use `Task.attempt` to convert failures to a typed
 * `Result`.
 *
 * @example
 * import { Task } from 'heron-ts/monad/task'
 * import { Result } from 'heron-ts/monad/result'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const program = pipe(
 *   Task.from(() => fetch('/api/user').then((r) => r.json())),
 *   Task.map((user: { name: string }) => user.name),
 *   Task.tap((name: string) => console.log(`Hello, ${name}!`)),
 *   (task) => Task.attempt(task, (e) => `Failed: ${e}`),
 * )
 *
 * await Task.run(program)
 * // Result.ok('Alice') on success — logs "Hello, Alice!"
 * // Result.err('Failed: ...') on network error
 */
export const Task = {
  of,
  from,
  run,
  map,
  chain,
  apply,
  tap,
  delay,
  sequence,
  parallel,
  race,
  attempt,
  fromResult,
} as const
