/**
 * @file     observable.ts
 * @location src/monad/observable.ts
 * @brief    The Observable monad for push-based event streams.
 */

import type { Unary, Predicate, Nullary } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An `Observer<Value>` receives values, errors, and completion signals
 * from an `Observable`.
 *
 * **Type shape:**
 *
 * `Observer<Value> = { next: Value -> void, error?: unknown -> void, complete?: () -> void }`
 */
export type Observer<Value> = {
  readonly next: (value: Value) => void
  readonly error?: (error: unknown) => void
  readonly complete?: () => void
}

/**
 * A thunk that cancels a subscription when called.
 *
 * **Type shape:**
 *
 * `Unsubscribe = () -> void`
 */
export type Unsubscribe = Nullary<void>

/**
 * An `Observable<Value>` is a push-based stream: a function that accepts
 * an `Observer` and returns an `Unsubscribe` thunk.
 *
 * Subscribing to an `Observable` registers the observer to receive
 * values, errors, and a completion signal. Calling the returned thunk
 * cancels the subscription and stops delivering values.
 *
 * **Type shape:**
 *
 * `Observable<Value> = (observer: Observer<Value>) -> Unsubscribe`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 *
 * const numbers = Observable.of(1, 2, 3)
 *
 * const unsubscribe = Observable.subscribe({
 *   next: (n) => console.log(n),
 *   complete: () => console.log('done'),
 * })(numbers)
 * // logs 1, 2, 3, "done"
 */
export type Observable<Value> = (observer: Observer<Value>) => Unsubscribe

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const noop: Unsubscribe = () => {}

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an `Observable` that emits each argument and then completes.
 *
 * **Type shape:**
 *
 * `of : (...Value) -> Observable<Value>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 *
 * Observable.of(1, 2, 3)
 * // emits 1, 2, 3, then completes
 */
const of = <Value>(
  ...values: ReadonlyArray<Value>
): Observable<Value> =>
  (observer) => {
    for (const value of values) observer.next(value)
    observer.complete?.()
    return noop
  }

/**
 * Creates an `Observable` that completes immediately without emitting.
 *
 * **Type shape:**
 *
 * `empty : () -> Observable<Value>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 *
 * Observable.empty() // emits nothing, completes immediately
 */
const empty = <Value>(): Observable<Value> =>
  (observer) => {
    observer.complete?.()
    return noop
  }

/**
 * Creates an `Observable` from a `ReadonlyArray`, emitting each element
 * and then completing.
 *
 * **Type shape:**
 *
 * `fromArray : ReadonlyArray<Value> -> Observable<Value>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 *
 * Observable.fromArray([1, 2, 3])
 * // emits 1, 2, 3, then completes
 */
const fromArray = <Value>(
  items: ReadonlyArray<Value>,
): Observable<Value> =>
  (observer) => {
    for (const item of items) observer.next(item)
    observer.complete?.()
    return noop
  }

/**
 * Creates an `Observable` from a `Promise`. Emits the resolved value and
 * completes. Forwards rejections to the error channel.
 *
 * **Type shape:**
 *
 * `fromPromise : Promise<Value> -> Observable<Value>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 *
 * Observable.fromPromise(Promise.resolve(42))
 * // emits 42, then completes
 */
const fromPromise = <Value>(
  promise: Promise<Value>,
): Observable<Value> =>
  (observer) => {
    let unsubscribed = false
    promise.then(
      (value) => {
        if (unsubscribed) return
        observer.next(value)
        observer.complete?.()
      },
      (error) => {
        if (!unsubscribed) observer.error?.(error)
      },
    )
    return () => {
      unsubscribed = true
    }
  }

/**
 * Creates an `Observable` that emits an incrementing counter every `ms`
 * milliseconds.
 *
 * **Type shape:**
 *
 * `interval : number -> Observable<number>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 *
 * const ticks = Observable.interval(1000)
 * // emits 0, 1, 2, ... every second
 */
const interval = (ms: number): Observable<number> =>
  (observer) => {
    let count = 0
    const id = setInterval(() => observer.next(count++), ms)
    return () => clearInterval(id)
  }

/**
 * Subscribes to an `Observable` by registering an `Observer`. Returns
 * an `Unsubscribe` thunk.
 *
 * **Type shape:**
 *
 * `subscribe : Observer<Value> -> Observable<Value> -> Unsubscribe`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 *
 * const unsubscribe = Observable.subscribe({
 *   next: (n: number) => console.log(n),
 *   complete: () => console.log('done'),
 * })(Observable.of(1, 2, 3))
 * // logs 1, 2, 3, "done"
 */
const subscribe = <Value>(
  observer: Observer<Value>,
) =>
  (observable: Observable<Value>): Unsubscribe =>
    observable(observer)

/**
 * Transforms each emitted value.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Observable<Value> -> Observable<Mapped>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Observable.of(1, 2, 3),
 *   Observable.map((n: number) => n * 2),
 *   Observable.subscribe({ next: console.log }),
 * )
 * // logs 2, 4, 6
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (source: Observable<Value>): Observable<Mapped> =>
    (observer) =>
      source({
        next: (value) => observer.next(transform(value)),
        error: observer.error,
        complete: observer.complete,
      })

/**
 * Keeps only emitted values satisfying the predicate.
 *
 * **Type shape:**
 *
 * `filter : Predicate<Value> -> Observable<Value> -> Observable<Value>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Observable.of(1, 2, 3, 4, 5),
 *   Observable.filter((n: number) => n % 2 === 0),
 *   Observable.subscribe({ next: console.log }),
 * )
 * // logs 2, 4
 */
const filter = <Value>(
  predicate: Predicate<Value>,
) =>
  (source: Observable<Value>): Observable<Value> =>
    (observer) =>
      source({
        next: (value) => {
          if (predicate(value)) observer.next(value)
        },
        error: observer.error,
        complete: observer.complete,
      })

/**
 * Maps each value to an inner `Observable` and merges all inner streams.
 * Also known as `mergeMap` or `flatMap`.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Observable<Next>) -> Observable<Value> -> Observable<Next>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Observable.of(1, 2, 3),
 *   Observable.chain((n: number) => Observable.of(n, n * 10)),
 *   Observable.subscribe({ next: console.log }),
 * )
 * // logs 1, 10, 2, 20, 3, 30
 */
const chain = <Value, Next>(
  next: Unary<Value, Observable<Next>>,
) =>
  (source: Observable<Value>): Observable<Next> =>
    (observer) => {
      const innerSubscriptions: Array<Unsubscribe> = []
      let outerDone = false
      let activeInnerCount = 0

      const tryComplete = () => {
        if (outerDone && activeInnerCount === 0) observer.complete?.()
      }

      const outerSubscription = source({
        next: (value) => {
          activeInnerCount++
          const innerSubscription = next(value)({
            next: observer.next,
            error: observer.error,
            complete: () => {
              activeInnerCount--
              tryComplete()
            },
          })
          innerSubscriptions.push(innerSubscription)
        },
        error: observer.error,
        complete: () => {
          outerDone = true
          tryComplete()
        },
      })

      return () => {
        outerSubscription()
        for (const subscription of innerSubscriptions) subscription()
      }
    }

/**
 * Takes only the first `n` emitted values, then completes.
 *
 * **Type shape:**
 *
 * `take : number -> Observable<Value> -> Observable<Value>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Observable.interval(100),
 *   Observable.take(3),
 *   Observable.subscribe({ next: console.log }),
 * )
 * // logs 0, 1, 2, then stops
 */
const take = (n: number) =>
  <Value>(source: Observable<Value>): Observable<Value> =>
    (observer) => {
      let count = 0
      let unsubscribe: Unsubscribe = noop
      unsubscribe = source({
        next: (value) => {
          if (count >= n) return
          observer.next(value)
          count++
          if (count >= n) {
            observer.complete?.()
            unsubscribe()
          }
        },
        error: observer.error,
        complete: observer.complete,
      })
      return unsubscribe
    }

/**
 * Runs a side effect on each emitted value, then passes it through.
 *
 * **Type shape:**
 *
 * `tap : (Value -> void) -> Observable<Value> -> Observable<Value>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Observable.of(1, 2, 3),
 *   Observable.tap((n: number) => console.log(`Saw: ${n}`)),
 *   Observable.subscribe({ next: console.log }),
 * )
 * // logs "Saw: 1", 1, "Saw: 2", 2, "Saw: 3", 3
 */
const tap = <Value>(
  sideEffect: Unary<Value, void>,
) =>
  (source: Observable<Value>): Observable<Value> =>
    (observer) =>
      source({
        next: (value) => {
          sideEffect(value)
          observer.next(value)
        },
        error: observer.error,
        complete: observer.complete,
      })

/**
 * Drains an `Observable` into a `Promise` of a collected array.
 *
 * **Type shape:**
 *
 * `toArray : Observable<Value> -> Promise<ReadonlyArray<Value>>`
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 *
 * await Observable.toArray(Observable.of(1, 2, 3))
 * // [1, 2, 3]
 */
const toArray = <Value>(
  source: Observable<Value>,
): Promise<ReadonlyArray<Value>> =>
  new Promise((resolve, reject) => {
    const out: Array<Value> = []
    source({
      next: (value) => out.push(value),
      error: reject,
      complete: () => resolve(out),
    })
  })

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Observable` monad for push-based event streams.
 *
 * An `Observable<Value>` is a function that accepts an `Observer` and
 * returns an `Unsubscribe` thunk. Values are pushed to the observer
 * as they arrive. Call the unsubscribe thunk to stop receiving values.
 *
 * @example
 * import { Observable } from 'heron-ts/monad/observable'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const program = pipe(
 *   Observable.interval(100),
 *   Observable.take(5),
 *   Observable.map((n: number) => n * n),
 *   Observable.filter((n: number) => n % 2 === 0),
 * )
 *
 * await Observable.toArray(program)
 * // [0, 4, 16] — squares of 0..4, keeping even ones
 */
export const Observable = {
  of,
  empty,
  fromArray,
  fromPromise,
  interval,
  subscribe,
  map,
  filter,
  chain,
  take,
  tap,
  toArray,
} as const
