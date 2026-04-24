import { describe, it, expect } from "vitest";
import type { Maybe } from "../type";
import * as maybe from '../maybe'

const double = (x: number) => x * 2
const increment = (x: number) => x + 1
const isAdult = (age: number) => age >= 18
const isValidAge = (age: number) => age > 0 && age < 150
const safeDivide = (dividend: number) =>
  (divisor: number): Maybe<number> => (divisor === 0)
    ? null : dividend / divisor

const formatAge = (age: number) => `Age: ${age}`

describe('fromNullable', () => {
  it('defines a return value as maybe from nullish values', () => {
    expect(maybe.fromNullable(42)).toBe(42)
    expect(maybe.fromNullable(null)).toBe(null)
    expect(maybe.fromNullable(undefined)).toBe(undefined)
  })
})

describe('map', () => {
  it('applies a transforming function on an optional value', () => {
    expect(maybe.map(double)(4)).toBe(8)
    expect(maybe.map(increment)(null)).toBe(null)
    expect(maybe.map(double)(undefined)).toBe(undefined)
  })
})

describe('flatMap', () => {
  it('flattens a maybe returning function over an optional value', () => {
    expect(maybe.flatMap(safeDivide(4))(2)).toBe(2)
    expect(maybe.flatMap(safeDivide(4))(0)).toBe(null)
    expect(maybe.flatMap(safeDivide(4))(null)).toBe(null)
  })
})

describe('getOrElse', () => {
  it('returns the underlying value or the result of the fallback thunk on nothing', () => {
    expect(maybe.getOrElse(() => 0)(42)).toBe(42)
    expect(maybe.getOrElse(() => 0)(null)).toBe(0)
    expect(maybe.getOrElse(() => 0)(undefined)).toBe(0)
  })
})

describe('orElse', () => {
  it('returns the underlying maybe or the result of the fallback thunk on nothing', () => {
    expect(maybe.orElse(() => 42)(2)).toBe(2)
    expect(maybe.orElse(() => null)(null)).toBe(null)
    expect(maybe.orElse(() => undefined)(null)).toBe(undefined)
  })
})

describe('filter', () => {
  it('keeps the value if the predicate passes, returns null if it fails', () => {
    expect(maybe.filter(isAdult)(21)).toBe(21)
    expect(maybe.filter(isAdult)(16)).toBe(null)
    expect(maybe.filter(isValidAge)(null)).toBe(null)
  })
})

describe('fold', () => {
  it('runs onJust when a value exists and onNothing when nothing', () => {
    expect(maybe.fold(() => 'no age', formatAge)(25)).toBe('Age: 25')
    expect(maybe.fold(() => 'no age', formatAge)(null)).toBe('no age')
    expect(maybe.fold(() => 'no age', formatAge)(undefined)).toBe('no age')
  })
})

describe('tap', () => {
  it('runs a side effect on the value without changing the maybe', () => {
    let lastSeen: number | null = null
    const logAge = (age: number) => { lastSeen = age }

    expect(maybe.tap(logAge)(25)).toBe(25)
    expect(lastSeen).toBe(25)

    expect(maybe.tap(logAge)(null)).toBe(null)
    expect(lastSeen).toBe(25)
  })
})
