/**
 * @file     reader.ts
 * @location src/monad/reader.ts
 * @brief    The Reader monad for dependency injection via a shared environment.
 */

import type { Unary } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A `Reader<Environment, Value>` is a computation that reads from a
 * shared `Environment` to produce a `Value`.
 *
 * Instead of passing configuration, loggers, or database connections
 * explicitly through every function, you describe computations that
 * *depend* on an environment, then supply that environment once at the
 * edge of your program with `Reader.run`.
 *
 * **Type shape:**
 *
 * `Reader<Environment, Value> = (env: Environment) -> Value`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 *
 * type Config = { readonly baseUrl: string; readonly timeout: number }
 *
 * const fetchUser = (id: number): Reader<Config, string> =>
 *   Reader.asks((config: Config) => `${config.baseUrl}/users/${id}`)
 *
 * Reader.run({ baseUrl: 'https://api.example.com', timeout: 5000 })(
 *   fetchUser(42),
 * )
 * // "https://api.example.com/users/42"
 */
export type Reader<Environment, Value> = (environment: Environment) => Value

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into `Reader`. The resulting computation ignores
 * the environment and always returns the value.
 *
 * **Type shape:**
 *
 * `of : Value -> Reader<Environment, Value>`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 *
 * Reader.run({})(Reader.of(42)) // 42
 */
const of = <Environment, Value>(
  value: Value,
): Reader<Environment, Value> =>
  () => value

/**
 * Executes a `Reader` by supplying its environment.
 *
 * **Type shape:**
 *
 * `run : Environment -> Reader<Environment, Value> -> Value`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 *
 * const greeting = Reader.asks((name: string) => `Hello, ${name}!`)
 * Reader.run('Alice')(greeting) // "Hello, Alice!"
 */
const run = <Environment, Value>(
  environment: Environment,
) =>
  (reader: Reader<Environment, Value>): Value =>
    reader(environment)

/**
 * Transforms the value produced by a `Reader`.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Reader<Environment, Value> -> Reader<Environment, Mapped>`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 * import { pipe } from 'heron-ts/prelude'
 *
 * type Config = { readonly port: number }
 *
 * pipe(
 *   Reader.asks((config: Config) => config.port),
 *   Reader.map((port: number) => `Listening on port ${port}`),
 *   Reader.run({ port: 8080 }),
 * )
 * // "Listening on port 8080"
 */
const map = <Environment, Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (reader: Reader<Environment, Value>): Reader<Environment, Mapped> =>
    (environment) => transform(reader(environment))

/**
 * Sequences two `Reader` computations. The result of the first is passed
 * to a function that produces the second, both sharing the same environment.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Reader<Environment, Next>) -> Reader<Environment, Value> -> Reader<Environment, Next>`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 * import { pipe } from 'heron-ts/prelude'
 *
 * type Config = { readonly baseUrl: string; readonly apiKey: string }
 *
 * const getBaseUrl = Reader.asks((config: Config) => config.baseUrl)
 * const getApiKey = Reader.asks((config: Config) => config.apiKey)
 *
 * const buildRequest = pipe(
 *   getBaseUrl,
 *   Reader.chain((url: string) =>
 *     pipe(
 *       getApiKey,
 *       Reader.map((key: string) => `${url}?key=${key}`),
 *     )
 *   ),
 * )
 *
 * Reader.run({ baseUrl: 'https://api.example.com', apiKey: 'abc123' })(buildRequest)
 * // "https://api.example.com?key=abc123"
 */
const chain = <Environment, Value, Next>(
  next: Unary<Value, Reader<Environment, Next>>,
) =>
  (reader: Reader<Environment, Value>): Reader<Environment, Next> =>
    (environment) => next(reader(environment))(environment)

/**
 * Applies a `Reader`-wrapped function to a `Reader`-wrapped value.
 * Both share the same environment.
 *
 * **Type shape:**
 *
 * `apply : Reader<Environment, (Value -> Mapped)> -> Reader<Environment, Value> -> Reader<Environment, Mapped>`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 * import { pipe } from 'heron-ts/prelude'
 *
 * type Config = { readonly multiplier: number }
 *
 * pipe(
 *   Reader.of<Config, number>(5),
 *   Reader.apply(
 *     Reader.asks((config: Config) => (n: number) => n * config.multiplier),
 *   ),
 *   Reader.run({ multiplier: 3 }),
 * )
 * // 15
 */
const apply = <Environment, Value, Mapped>(
  readerOfFunction: Reader<Environment, Unary<Value, Mapped>>,
) =>
  (reader: Reader<Environment, Value>): Reader<Environment, Mapped> =>
    (environment) => readerOfFunction(environment)(reader(environment))

/**
 * Returns the entire environment as the value.
 *
 * **Type shape:**
 *
 * `ask : () -> Reader<Environment, Environment>`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 *
 * Reader.run({ port: 8080 })(Reader.ask())
 * // { port: 8080 }
 */
const ask = <Environment>(): Reader<Environment, Environment> =>
  (environment) => environment

/**
 * Projects a value from the environment using a function.
 *
 * Equivalent to `pipe(ask(), map(fn))` but more concise.
 *
 * **Type shape:**
 *
 * `asks : (Environment -> Value) -> Reader<Environment, Value>`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 *
 * type Config = { readonly port: number }
 *
 * Reader.run({ port: 8080 })(
 *   Reader.asks((config: Config) => config.port),
 * )
 * // 8080
 */
const asks = <Environment, Value>(
  project: Unary<Environment, Value>,
): Reader<Environment, Value> =>
  (environment) => project(environment)

/**
 * Locally adjusts the environment for a sub-computation. The outer
 * environment is unchanged.
 *
 * **Type shape:**
 *
 * `local : (OuterEnv -> InnerEnv) -> Reader<InnerEnv, Value> -> Reader<OuterEnv, Value>`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 * import { pipe } from 'heron-ts/prelude'
 *
 * type Config = { readonly baseUrl: string; readonly debug: boolean }
 *
 * const withDebug = Reader.local(
 *   (config: Config): Config => ({ ...config, debug: true }),
 * )
 *
 * const debugReader = withDebug(
 *   Reader.asks((config: Config) => config.debug),
 * )
 *
 * Reader.run({ baseUrl: 'https://example.com', debug: false })(debugReader)
 * // true — debug was locally set to true
 */
const local = <OuterEnvironment, InnerEnvironment>(
  adjust: Unary<OuterEnvironment, InnerEnvironment>,
) =>
  <Value>(
    reader: Reader<InnerEnvironment, Value>,
  ): Reader<OuterEnvironment, Value> =>
    (environment) => reader(adjust(environment))

/**
 * Runs a `ReadonlyArray<Reader<Environment, Value>>` against the same
 * environment, collecting all results.
 *
 * **Type shape:**
 *
 * `sequence : ReadonlyArray<Reader<Environment, Value>> -> Reader<Environment, ReadonlyArray<Value>>`
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 *
 * type Config = { readonly multiplier: number }
 *
 * const readers = [
 *   Reader.asks((c: Config) => c.multiplier * 1),
 *   Reader.asks((c: Config) => c.multiplier * 2),
 *   Reader.asks((c: Config) => c.multiplier * 3),
 * ]
 *
 * Reader.run({ multiplier: 5 })(Reader.sequence(readers))
 * // [5, 10, 15]
 */
const sequence = <Environment, Value>(
  readers: ReadonlyArray<Reader<Environment, Value>>,
): Reader<Environment, ReadonlyArray<Value>> =>
  (environment) => readers.map((reader) => reader(environment))

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Reader` monad for dependency injection via a shared environment.
 *
 * A `Reader<Environment, Value>` is a computation that reads from a
 * shared `Environment` to produce a `Value`. Supply the environment
 * once at the program's edge with `Reader.run`.
 *
 * @example
 * import { Reader } from 'heron-ts/monad/reader'
 * import { pipe } from 'heron-ts/prelude'
 *
 * type Config = { readonly baseUrl: string; readonly port: number }
 *
 * const buildUrl = pipe(
 *   Reader.ask<Config>(),
 *   Reader.map((config) => `${config.baseUrl}:${config.port}`),
 * )
 *
 * Reader.run({ baseUrl: 'https://example.com', port: 8080 })(buildUrl)
 * // "https://example.com:8080"
 */
export const Reader = {
  of,
  run,
  map,
  chain,
  apply,
  ask,
  asks,
  local,
  sequence,
} as const
