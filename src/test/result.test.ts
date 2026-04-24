import { describe, it, expect } from "vitest"
import type { Result, Maybe } from "../type"
import * as result from '../result'
import { err, ok } from '../result'
import { isNullable, isOk, isErr } from "../guard"

const failingDivide = (x: number): Result<number, string> =>
  x === 0 ? err('cannot divide by zero') : ok(10 / x)

const isValidNumber = (value: string): boolean =>
  value.trim() !== '' && !isNaN(Number(value)) && isFinite(Number(value))

const parseAge = (age: Maybe<string>): Result<number, string> =>
  isNullable(age) ? err('age must have a value')
    : !isValidNumber(age) ? err('age must be a valid number')
      : ok(Number(age.trim()))

const isAdult = (age: Maybe<string>): Result<boolean, string> =>
  result.flatMap((n: number): Result<boolean, string> => ok(n >= 18))(parseAge(age))


describe('fromNullable', () => {
  it('defined a result from nullish values', () => {
    expect(isOk(result.fromNullable("No value")(24))).toBe(true)
    expect(isErr(result.fromNullable("No value")(null))).toBe(true)
  })
})

describe('ok', () => {
  it('constructs an Ok result', () => {
    const value = ok(42)
    expect(isOk(value)).toBe(true)
    expect(value).toEqual({ _tag: 'Ok', value: 42 })
  })
})

describe('err', () => {
  it('constructs an Err result', () => {
    const value = err('something went wrong')
    expect(isErr(value)).toBe(true)
    expect(value).toEqual({ _tag: 'Err', error: 'something went wrong' })
  })
})

describe('map', () => {
  it('transforms the Ok value leaving Err untouched', () => {
    expect(result.map((n: number) => n * 2)(ok(21))).toEqual(ok(42))
    expect(result.map((n: number) => n * 2)(err('failed'))).toEqual(err('failed'))
  })
})

describe('mapError', () => {
  it('transforms the Err value leaving Ok untouched', () => {
    expect(result.mapError((e: string) => `Error: ${e}`)(err('failed'))).toEqual(err('Error: failed'))
    expect(result.mapError((e: string) => `Error: ${e}`)(ok(42))).toEqual(ok(42))
  })
})

describe('flatMap', () => {
  it('chains a result returning function over the Ok value', () => {
    expect(result.flatMap(failingDivide)(ok(2))).toEqual(ok(5))
    expect(result.flatMap(failingDivide)(ok(0))).toEqual(err('cannot divide by zero'))
    expect(result.flatMap(failingDivide)(err('already failed'))).toEqual(err('already failed'))
  })
})

describe('flatMapError', () => {
  it('chains a result returning function over the Err value', () => {
    expect(result.flatMapError((e: string) => err(`wrapped: ${e}`))(err('failed'))).toEqual(err('wrapped: failed'))
    expect(result.flatMapError((e: string) => err(`wrapped: ${e}`))(ok(42))).toEqual(ok(42))
  })
})

describe('getOrElse', () => {
  it('returns the Ok value or the result of the fallback with the error', () => {
    expect(result.getOrElse((e: string) => 0)(ok(42))).toBe(42)
    expect(result.getOrElse((e: string) => 0)(err('failed'))).toBe(0)
  })
})

describe('orElse', () => {
  it('returns the Ok result or attempts recovery with the error', () => {
    expect(result.orElse((e: string) => ok(0))(ok(42))).toEqual(ok(42))
    expect(result.orElse((e: string) => ok(0))(err('failed'))).toEqual(ok(0))
    expect(result.orElse((e: string) => err(`unrecoverable: ${e}`))(err('failed'))).toEqual(err('unrecoverable: failed'))
  })
})

describe('fold', () => {
  it('merges both rails into a single value', () => {
    expect(result.fold(
      (n: number) => `value is ${n}`,
      (e: string) => `error is ${e}`
    )(ok(42))).toBe('value is 42')

    expect(result.fold(
      (n: number) => `value is ${n}`,
      (e: string) => `error is ${e}`
    )(err('failed'))).toBe('error is failed')
  })
})

describe('tap', () => {
  it('runs a side effect on Ok without changing the result', () => {
    let lastSeen: number | null = null
    const logValue = (n: number) => { lastSeen = n }

    expect(result.tap(logValue)(ok(42))).toEqual(ok(42))
    expect(lastSeen).toBe(42)

    expect(result.tap(logValue)(err('failed'))).toEqual(err('failed'))
    expect(lastSeen).toBe(42)
  })
})

describe('tapError', () => {
  it('runs a side effect on Err without changing the result', () => {
    let lastSeen: string | null = null
    const logError = (e: string) => { lastSeen = e }

    expect(result.tapError(logError)(err('failed'))).toEqual(err('failed'))
    expect(lastSeen).toBe('failed')

    expect(result.tapError(logError)(ok(42))).toEqual(ok(42))
    expect(lastSeen).toBe('failed')
  })
})

describe('parseAge (integration)', () => {
  it('correctly parses valid and invalid ages through the result pipeline', () => {
    expect(parseAge('25')).toEqual(ok(25))
    expect(parseAge(null)).toEqual(err('age must have a value'))
    expect(parseAge('abc')).toEqual(err('age must be a valid number'))
  })
})
