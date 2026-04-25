import { describe, it, expect } from 'vitest'
import { identity, always, pipe, flow, curry } from '../function'
import { isNullable } from '../guard'
import type { Binary, Unary, Maybe } from '../type'

describe('identity', () => {
  it('returns the value it was given', () => {
    expect(identity(42)).toBe(42)
    expect(identity('hello')).toBe('hello')
  })
})

describe('always', () => {
  it('returns a function that always returns the initial value it was given', () => {
    expect(always(42)()).toBe(42)
    expect(always('hello')()).toBe('hello')
  })
})

describe('pipe', () => {
  it('applies a series of functions to a given value', () => {
    const double = (x: number) => x * 2
    const increment = (x: number) => x + 1
    expect(pipe(3, double, increment)).toBe(7)
  })
})

describe('flow', () => {
  it('flattens a series of functions into a single function', () => {
    const double = (x: number) => x * 2;
    const increment = (x: number) => x + 1;
    expect(flow(double, increment)(3)).toBe(7)
  })
})

describe('curry', () => {
  it('transforms a multi-arg function to a chain of unary functions', () => {
    const binAdd: Binary<number> = (a: number, b: number) => a + b
    const binMaybeString: Binary<Maybe<string>, string> = (maybe: Maybe<string>, trail: string) =>
      isNullable(maybe) ? trail : [maybe, trail].join(' ')
    const curAdd: Unary<number, Unary<number>> = curry(binAdd)
    const curMaybeString: Unary<Maybe<string>, Unary<string>> = curry(binMaybeString)
    expect(binAdd(2, 2)).toBe(4)
    expect(curAdd(10)(2)).toBe(12)
    expect(binMaybeString('hello', 'world')).toBe('hello world')
    expect(curMaybeString(null)('fallback')).toBe('fallback')
  })
})
