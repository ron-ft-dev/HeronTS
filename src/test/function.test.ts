import { describe, it, expect } from 'vitest'
import { identity, always, pipe, flow } from '../function'
import type { Binary } from '../type'

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
