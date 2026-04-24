import type { Result, Ok, Err } from "./type"

export const isNull = (value: unknown): value is null => value === null

export const isUndefined = (value: unknown): value is undefined => value === undefined

export const isNullable = (value: unknown): value is null | undefined =>
  value === undefined  || value === null

export const isDefined = <T>(value: T): value is NonNullable<T> =>
  value !== undefined && value !== null

export const isOk = <V, E>(result: Result<V, E>): result is Ok<V> =>
  result._tag === 'Ok'

export const isErr = <V, E>(result: Result<V, E>): result is Err<E> =>
  result._tag === 'Err'
