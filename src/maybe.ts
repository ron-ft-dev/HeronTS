import type { Maybe, Unary, Thunk, Predicate } from './type'
import { isNullable } from './guard'

export type { Maybe }

export const fromNullable = <T>(value: T | null | undefined): Maybe<T> => value

export const map = <T, A>(mapper: Unary<T, A>) =>
  (maybe: Maybe<T>): Maybe<A> =>
    isNullable(maybe) ? maybe : mapper(maybe)

export const flatMap = <T, A>(mapper: Unary<T, Maybe<A>>) =>
  (maybe: Maybe<T>): Maybe<A> =>
    isNullable(maybe) ? maybe : mapper(maybe)

export const getOrElse = <T>(fallback: Thunk<T>) =>
  (maybe: Maybe<T>): T =>
    isNullable(maybe) ? fallback() : maybe

export const orElse = <T>(then: Thunk<Maybe<T>>) =>
  (maybe: Maybe<T>): Maybe<T> =>
    isNullable(maybe) ? then() : maybe

export const filter = <T>(predicate: Predicate<T>) =>
  (maybe: Maybe<T>): Maybe<T> =>
    isNullable(maybe) ? maybe : predicate(maybe) ? maybe : null

export const fold = <T, B>(onNothing: Thunk<B>, onJust: Unary<T, B>) =>
  (maybe: Maybe<T>): B =>
    isNullable(maybe) ? onNothing() : onJust(maybe)

export const tap = <T>(effect: Unary<T, void>) =>
  (maybe: Maybe<T>): Maybe<T> =>
    isNullable(maybe) ? maybe : (effect(maybe), maybe)
