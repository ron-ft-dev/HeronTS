import type { Ok, Err, Result, Unary, Thunk, Maybe } from "./type"
import { isNullable, isErr, isOk } from './guard'

export const ok = <V>(value: V): Ok<V> => ({ _tag: 'Ok', value })
export const err = <E>(error: E): Err<E> => ({ _tag: 'Err', error })

export const fromNullable = <V, E>(error: E) =>
  (value: V | null | undefined): Result<V, E> =>
    isNullable(value) ? err(error) : ok(value)

export const fromMaybe = <V, E>(error: E) =>
  (value: Maybe<V>): Result<V, E> =>
    isNullable(value) ? err(error) : ok(value)

export const map = <V, W, E>(mapper: Unary<V, W>) =>
  (result: Result<V, E>): Result<W, E> =>
    isErr(result) ? result : ok(mapper(result.value))

export const mapError = <_, E, F>(mapper: Unary<E, F>) =>
  (result: Result<_, E>): Result<_, F> =>
    isOk(result) ? result : err(mapper(result.error))

export const flatMap = <V, W, E>(mapper: Unary<V, Result<W, E>>) =>
  (result: Result<V, E>): Result<W, E> =>
    isErr(result) ? result : mapper(result.value)

export const flatMapError = <_, E, F>(mapper: Unary<E, Result<_, F>>) =>
  (result: Result<_, E>): Result<_, F> =>
    isOk(result) ? result : mapper(result.error)

export const getOrElse = <V, E>(fallback: Unary<E, V>) =>
  (result: Result<V, E>): V =>
    isErr(result) ? fallback(result.error) : result.value

export const orElse = <V, E>(then: Unary<E, Result<V, E>>) =>
  (result: Result<V, E>): Result<V, E> =>
    isErr(result) ? then(result.error) : result

export const fold = <V, W, E>(onOk: Unary<V, W>, onErr: Unary<E, W>) =>
  (result: Result<V, E>): W =>
    isErr(result) ? onErr(result.error) : onOk(result.value)

export const tap = <V, E>(effect: Unary<V, void>) =>
  (result: Result<V, E>): Result<V, E> =>
    isErr(result) ? result : (effect(result.value), result)

export const tapError = <_, E>(effect: Unary<E, void>) =>
  (result: Result<_, E>): Result<_, E> =>
    isOk(result) ? result : (effect(result.error), result)
