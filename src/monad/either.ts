/**
 * @file     either.ts
 * @location src/monad/either.ts
 * @brief    The Either type for values that are one of two possibilities.
 *
 * `Either<Left, Right>` represents a value that is one of two types —
 * neither of which is privileged as "success" or "failure". Both sides
 * are equally valid values.
 *
 * For computations that can fail, use `Result<Value, Error>` instead.
 * `Either` is for genuinely symmetric choices: a config that is either
 * a file path or an inline object, a shape that is either a circle or
 * a rectangle, a response that is either cached or fresh.
 *
 * Operations on `Either` are explicit about which side they operate on:
 * `mapLeft`, `mapRight`, `chainLeft`, `chainRight`. There is no default
 * "success rail."
 */

import type { Unary } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The left side of an `Either`.
 *
 * **Type shape:**
 *
 * `Left<Value> = { _tag: 'Left', value: Value }`
 */
export type Left<Value> = {
  readonly _tag: 'Left'
  readonly value: Value
}

/**
 * The right side of an `Either`.
 *
 * **Type shape:**
 *
 * `Right<Value> = { _tag: 'Right', value: Value }`
 */
export type Right<Value> = {
  readonly _tag: 'Right'
  readonly value: Value
}

/**
 * An `Either<LeftValue, RightValue>` is a value that is one of two
 * possibilities. Unlike `Result`, neither side is "success" or "failure"
 * — both are equally valid values.
 *
 * Use `Either` when a value can genuinely be one of two unrelated types
 * and both cases are meaningful, not when one case represents an error.
 *
 * **Type shape:**
 *
 * `Either<LeftValue, RightValue> = Left<LeftValue> | Right<RightValue>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 *
 * // A config that is either a file path or an inline object
 * type Config = Either<string, { port: number; host: string }>
 *
 * const fileConfig: Config = Either.left('/etc/app/config.json')
 * const inlineConfig: Config = Either.right({ port: 8080, host: 'localhost' })
 *
 * Either.run({
 *   onLeft: (path) => `Loading config from ${path}`,
 *   onRight: (config) => `Using inline config on port ${config.port}`,
 * })(fileConfig)
 * // "Loading config from /etc/app/config.json"
 */
export type Either<LeftValue, RightValue> = Left<LeftValue> | Right<RightValue>

/**
 * The two handlers required to eliminate an `Either`. Passed to
 * `Either.run` and `Either.fold`.
 *
 * **Type shape:**
 *
 * `EitherHandlers<LeftValue, RightValue, Outcome> = { onLeft: LeftValue -> Outcome, onRight: RightValue -> Outcome }`
 */
export type EitherHandlers<LeftValue, RightValue, Outcome> = {
  readonly onLeft: Unary<LeftValue, Outcome>
  readonly onRight: Unary<RightValue, Outcome>
}

// ─────────────────────────────────────────────────────────────────────────────
// Constructors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a `Left<Value>`.
 *
 * **Type shape:**
 *
 * `left : LeftValue -> Either<LeftValue, never>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 *
 * Either.left('/etc/config.json') // { _tag: 'Left', value: '/etc/config.json' }
 */
export const left = <LeftValue>(value: LeftValue): Left<LeftValue> => ({
  _tag: 'Left',
  value,
})

/**
 * Constructs a `Right<Value>`.
 *
 * **Type shape:**
 *
 * `right : RightValue -> Either<never, RightValue>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 *
 * Either.right({ port: 8080 }) // { _tag: 'Right', value: { port: 8080 } }
 */
export const right = <RightValue>(value: RightValue): Right<RightValue> => ({
  _tag: 'Right',
  value,
})

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Eliminates an `Either` by providing handlers for both sides.
 *
 * This is the exit point from `Either`-land. Both handlers must produce
 * the same `Outcome` type.
 *
 * **Type shape:**
 *
 * `run : EitherHandlers<LeftValue, RightValue, Outcome> -> Either<LeftValue, RightValue> -> Outcome`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 *
 * type Config = Either<string, { port: number }>
 *
 * const describe = Either.run({
 *   onLeft: (path: string) => `File: ${path}`,
 *   onRight: (config: { port: number }) => `Inline: port ${config.port}`,
 * })
 *
 * describe(Either.left('/etc/config.json')) // "File: /etc/config.json"
 * describe(Either.right({ port: 8080 }))   // "Inline: port 8080"
 */
const run = <LeftValue, RightValue, Outcome>(
  handlers: EitherHandlers<LeftValue, RightValue, Outcome>,
) =>
  (either: Either<LeftValue, RightValue>): Outcome =>
    either._tag === 'Left'
      ? handlers.onLeft(either.value)
      : handlers.onRight(either.value)

/**
 * Alias for `run`.
 *
 * **Type shape:**
 *
 * `fold : EitherHandlers<LeftValue, RightValue, Outcome> -> Either<LeftValue, RightValue> -> Outcome`
 */
const fold = run

/**
 * Transforms the value on the `Left` side. No-op if `Right`.
 *
 * **Type shape:**
 *
 * `mapLeft : (LeftValue -> Mapped) -> Either<LeftValue, RightValue> -> Either<Mapped, RightValue>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 * import { pipe } from 'heron-ts/prelude'
 *
 * type Config = Either<string, { port: number }>
 *
 * pipe(
 *   Either.left('/etc/config.json') as Config,
 *   Either.mapLeft((path: string) => path.toUpperCase()),
 * )
 * // Either.left('/ETC/CONFIG.JSON')
 *
 * pipe(
 *   Either.right({ port: 8080 }) as Config,
 *   Either.mapLeft((path: string) => path.toUpperCase()),
 * )
 * // Either.right({ port: 8080 }) — unchanged
 */
const mapLeft = <LeftValue, Mapped, RightValue>(
  transform: Unary<LeftValue, Mapped>,
) =>
  (either: Either<LeftValue, RightValue>): Either<Mapped, RightValue> =>
    either._tag === 'Left'
      ? left(transform(either.value))
      : right(either.value)

/**
 * Transforms the value on the `Right` side. No-op if `Left`.
 *
 * **Type shape:**
 *
 * `mapRight : (RightValue -> Mapped) -> Either<LeftValue, RightValue> -> Either<LeftValue, Mapped>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Either.right({ port: 8080 }),
 *   Either.mapRight((config: { port: number }) => config.port),
 * )
 * // Either.right(8080)
 */
const mapRight = <LeftValue, RightValue, Mapped>(
  transform: Unary<RightValue, Mapped>,
) =>
  (either: Either<LeftValue, RightValue>): Either<LeftValue, Mapped> =>
    either._tag === 'Right'
      ? right(transform(either.value))
      : left(either.value)

/**
 * Transforms both sides simultaneously. Also known as `bimap`.
 *
 * Useful when you need to normalize both sides to a common type without
 * fully eliminating the `Either` first.
 *
 * **Type shape:**
 *
 * `mapBoth : (LeftValue -> MappedLeft, RightValue -> MappedRight) -> Either<LeftValue, RightValue> -> Either<MappedLeft, MappedRight>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const normalize = Either.mapBoth(
 *   (path: string) => path.toLowerCase(),
 *   (config: { port: number }) => ({ ...config, port: config.port + 1 }),
 * )
 *
 * normalize(Either.left('/ETC/CONFIG'))     // Either.left('/etc/config')
 * normalize(Either.right({ port: 8080 }))  // Either.right({ port: 8081 })
 */
const mapBoth = <LeftValue, MappedLeft, RightValue, MappedRight>(
  transformLeft: Unary<LeftValue, MappedLeft>,
  transformRight: Unary<RightValue, MappedRight>,
) =>
  (either: Either<LeftValue, RightValue>): Either<MappedLeft, MappedRight> =>
    either._tag === 'Left'
      ? left(transformLeft(either.value))
      : right(transformRight(either.value))

/**
 * Sequences on the `Left` side. No-op if `Right`.
 *
 * **Type shape:**
 *
 * `chainLeft : (LeftValue -> Either<Mapped, RightValue>) -> Either<LeftValue, RightValue> -> Either<Mapped, RightValue>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const expandPath = (path: string): Either<string, { port: number }> =>
 *   path.startsWith('~')
 *     ? Either.left(path.replace('~', '/home/user'))
 *     : Either.left(path)
 *
 * pipe(
 *   Either.left('~/config.json'),
 *   Either.chainLeft(expandPath),
 * )
 * // Either.left('/home/user/config.json')
 */
const chainLeft = <LeftValue, Mapped, RightValue>(
  next: Unary<LeftValue, Either<Mapped, RightValue>>,
) =>
  (either: Either<LeftValue, RightValue>): Either<Mapped, RightValue> =>
    either._tag === 'Left'
      ? next(either.value)
      : right(either.value)

/**
 * Sequences on the `Right` side. No-op if `Left`.
 *
 * **Type shape:**
 *
 * `chainRight : (RightValue -> Either<LeftValue, Mapped>) -> Either<LeftValue, RightValue> -> Either<LeftValue, Mapped>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const validatePort = (config: { port: number }): Either<string, { port: number }> =>
 *   config.port > 0 && config.port < 65536
 *     ? Either.right(config)
 *     : Either.left(`Invalid port: ${config.port}`)
 *
 * pipe(
 *   Either.right({ port: 8080 }),
 *   Either.chainRight(validatePort),
 * )
 * // Either.right({ port: 8080 })
 *
 * pipe(
 *   Either.right({ port: 99999 }),
 *   Either.chainRight(validatePort),
 * )
 * // Either.left('Invalid port: 99999')
 */
const chainRight = <LeftValue, RightValue, Mapped>(
  next: Unary<RightValue, Either<LeftValue, Mapped>>,
) =>
  (either: Either<LeftValue, RightValue>): Either<LeftValue, Mapped> =>
    either._tag === 'Right'
      ? next(either.value)
      : left(either.value)

/**
 * Swaps the sides: `Left` becomes `Right`, `Right` becomes `Left`.
 *
 * **Type shape:**
 *
 * `swap : Either<LeftValue, RightValue> -> Either<RightValue, LeftValue>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 *
 * Either.swap(Either.left('hello'))  // Either.right('hello')
 * Either.swap(Either.right(42))      // Either.left(42)
 */
const swap = <LeftValue, RightValue>(
  either: Either<LeftValue, RightValue>,
): Either<RightValue, LeftValue> =>
  either._tag === 'Left'
    ? right(either.value)
    : left(either.value)




/**
 * Returns `true` if the `Either` is `Left`.
 *
 * Narrows the type to `Left<LeftValue>` in the surrounding scope.
 *
 * **Type shape:**
 *
 * `isLeft : Either<LeftValue, RightValue> -> either is Left<LeftValue>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 *
 * const value: Either<string, number> = Either.left('hello')
 *
 * if (Either.isLeft(value)) {
 *   value.value // 'hello' — narrowed to Left<string>
 * }
 */
const isLeft = <LeftValue, RightValue>(
  either: Either<LeftValue, RightValue>,
): either is Left<LeftValue> =>
  either._tag === 'Left'

/**
 * Returns `true` if the `Either` is `Right`.
 *
 * Narrows the type to `Right<RightValue>` in the surrounding scope.
 *
 * **Type shape:**
 *
 * `isRight : Either<LeftValue, RightValue> -> either is Right<RightValue>`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 *
 * const value: Either<string, number> = Either.right(42)
 *
 * if (Either.isRight(value)) {
 *   value.value // 42 — narrowed to Right<number>
 * }
 */
const isRight = <LeftValue, RightValue>(
  either: Either<LeftValue, RightValue>,
): either is Right<RightValue> =>
  either._tag === 'Right'

/**
 * Splits a `ReadonlyArray<Either<LeftValue, RightValue>>` into all
 * `Left` values and all `Right` values.
 *
 * **Type shape:**
 *
 * `partition : ReadonlyArray<Either<LeftValue, RightValue>> -> { lefts: ReadonlyArray<LeftValue>, rights: ReadonlyArray<RightValue> }`
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 *
 * Either.partition([
 *   Either.left('a'),
 *   Either.right(1),
 *   Either.left('b'),
 *   Either.right(2),
 * ])
 * // { lefts: ['a', 'b'], rights: [1, 2] }
 */
const partition = <LeftValue, RightValue>(
  eithers: ReadonlyArray<Either<LeftValue, RightValue>>,
): {
  readonly lefts: ReadonlyArray<LeftValue>
  readonly rights: ReadonlyArray<RightValue>
} => {
  const lefts: Array<LeftValue> = []
  const rights: Array<RightValue> = []
  for (const either of eithers) {
    if (either._tag === 'Left') lefts.push(either.value)
    else rights.push(either.value)
  }
  return { lefts, rights }
}

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Either` type for values that are one of two possibilities.
 *
 * An `Either<LeftValue, RightValue>` is either `Left<LeftValue>` or
 * `Right<RightValue>`. Neither side is privileged as "success" or
 * "failure" — both are equally valid values.
 *
 * For computations that can fail, use `Result<Value, Error>` instead.
 *
 * @example
 * import { Either } from 'heron-ts/monad/either'
 * import { pipe } from 'heron-ts/prelude'
 *
 * type Shape = Either<Circle, Rectangle>
 *
 * const area = Either.run({
 *   onLeft: (circle: Circle) => Math.PI * circle.radius ** 2,
 *   onRight: (rect: Rectangle) => rect.width * rect.height,
 * })
 *
 * area(Either.left({ radius: 5 }))           // ~78.5
 * area(Either.right({ width: 4, height: 6 })) // 24
 */
export const Either = {
  left,
  right,
  run,
  fold,
  mapLeft,
  mapRight,
  mapBoth,
  chainLeft,
  chainRight,
  swap,
  isLeft,
  isRight,
  partition,
} as const
