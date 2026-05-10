/**
 * @file     parser.ts
 * @location src/monad/parser.ts
 * @brief    Parser combinators: composable string parsers.
 */

import type { Unary, Predicate } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The successful result of a parse: the parsed `Value` and the remaining
 * unconsumed input.
 *
 * **Type shape:**
 *
 * `ParseSuccess<Value> = { _tag: 'Success', value: Value, rest: string }`
 */
export type ParseSuccess<Value> = {
  readonly _tag: 'Success'
  readonly value: Value
  readonly rest: string
}

/**
 * The failed result of a parse: an error message and the unconsumed
 * input at the point of failure.
 *
 * **Type shape:**
 *
 * `ParseFailure = { _tag: 'Failure', message: string, rest: string }`
 */
export type ParseFailure = {
  readonly _tag: 'Failure'
  readonly message: string
  readonly rest: string
}

/**
 * The result of running a `Parser<Value>`.
 *
 * **Type shape:**
 *
 * `ParseResult<Value> = ParseSuccess<Value> | ParseFailure`
 */
export type ParseResult<Value> = ParseSuccess<Value> | ParseFailure

/**
 * A `Parser<Value>` is a function that consumes a prefix of a string
 * and either succeeds with a parsed `Value` and the remaining input, or
 * fails with an error message.
 *
 * Parsers compose via `chain` (sequence), `orElse` (choice), and
 * `many` / `many1` (repetition).
 *
 * **Type shape:**
 *
 * `Parser<Value> = (input: string) -> ParseResult<Value>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * const result = Parser.run('123abc')(Parser.integer)
 * // { _tag: 'Success', value: 123, rest: 'abc' }
 */
export type Parser<Value> = (input: string) => ParseResult<Value>

// ─────────────────────────────────────────────────────────────────────────────
// Internal constructors
// ─────────────────────────────────────────────────────────────────────────────

const success = <Value>(
  value: Value,
  rest: string,
): ParseSuccess<Value> => ({ _tag: 'Success', value, rest })

const failure = (
  message: string,
  rest: string,
): ParseFailure => ({ _tag: 'Failure', message, rest })

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into `Parser`. Consumes no input and always succeeds.
 *
 * **Type shape:**
 *
 * `of : Value -> Parser<Value>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.run('hello')(Parser.of(42))
 * // { _tag: 'Success', value: 42, rest: 'hello' }
 */
const of = <Value>(value: Value): Parser<Value> =>
  (input) => success(value, input)

/**
 * A parser that always fails with the given message.
 *
 * **Type shape:**
 *
 * `fail : string -> Parser<never>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.run('hello')(Parser.fail('expected something else'))
 * // { _tag: 'Failure', message: 'expected something else', rest: 'hello' }
 */
const fail = (message: string): Parser<never> =>
  (input) => failure(message, input)

/**
 * Executes a `Parser` against an input string.
 *
 * **Type shape:**
 *
 * `run : string -> Parser<Value> -> ParseResult<Value>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.run('123')(Parser.integer)
 * // { _tag: 'Success', value: 123, rest: '' }
 */
const run = (input: string) =>
  <Value>(parser: Parser<Value>): ParseResult<Value> =>
    parser(input)

/**
 * Returns `true` if the `ParseResult` is a success.
 *
 * **Type shape:**
 *
 * `isSuccess : ParseResult<Value> -> result is ParseSuccess<Value>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.isSuccess(Parser.run('123')(Parser.integer)) // true
 */
const isSuccess = <Value>(
  result: ParseResult<Value>,
): result is ParseSuccess<Value> =>
  result._tag === 'Success'

/**
 * Returns `true` if the `ParseResult` is a failure.
 *
 * **Type shape:**
 *
 * `isFailure : ParseResult<Value> -> result is ParseFailure`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.isFailure(Parser.run('abc')(Parser.integer)) // true
 */
const isFailure = <Value>(
  result: ParseResult<Value>,
): result is ParseFailure =>
  result._tag === 'Failure'

/**
 * Transforms the parsed value. No-op if the parser fails.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Parser<Value> -> Parser<Mapped>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const result = pipe(
 *   Parser.integer,
 *   Parser.map((n: number) => n * 2),
 *   Parser.run('21'),
 * )
 * // { _tag: 'Success', value: 42, rest: '' }
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (parser: Parser<Value>): Parser<Mapped> =>
    (input) => {
      const result = parser(input)
      return result._tag === 'Failure'
        ? result
        : success(transform(result.value), result.rest)
    }

/**
 * Sequences two parsers: the result of the first is passed to a
 * function that produces the second parser, which runs on the
 * remaining input.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Parser<Next>) -> Parser<Value> -> Parser<Next>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // Parse a digit followed by a letter
 * const parser = pipe(
 *   Parser.digit,
 *   Parser.chain((digit: string) =>
 *     pipe(
 *       Parser.letter,
 *       Parser.map((letter: string) => `${digit}${letter}`),
 *     )
 *   ),
 * )
 *
 * Parser.run('3a')(parser)
 * // { _tag: 'Success', value: '3a', rest: '' }
 */
const chain = <Value, Next>(
  next: Unary<Value, Parser<Next>>,
) =>
  (parser: Parser<Value>): Parser<Next> =>
    (input) => {
      const result = parser(input)
      return result._tag === 'Failure'
        ? result
        : next(result.value)(result.rest)
    }

/**
 * Tries the first parser; if it fails without consuming input, tries
 * the alternative.
 *
 * **Type shape:**
 *
 * `orElse : (() -> Parser<Value>) -> Parser<Value> -> Parser<Value>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const letterOrDigit = pipe(
 *   Parser.letter,
 *   Parser.orElse(() => Parser.digit),
 * )
 *
 * Parser.run('a1')(letterOrDigit) // { _tag: 'Success', value: 'a', rest: '1' }
 * Parser.run('1a')(letterOrDigit) // { _tag: 'Success', value: '1', rest: 'a' }
 */
const orElse = <Value>(
  alternative: () => Parser<Value>,
) =>
  (parser: Parser<Value>): Parser<Value> =>
    (input) => {
      const result = parser(input)
      if (result._tag === 'Success') return result
      if (result.rest.length !== input.length) return result
      return alternative()(input)
    }

/**
 * Tries each parser in order and returns the first success.
 *
 * **Type shape:**
 *
 * `choice : ReadonlyArray<Parser<Value>> -> Parser<Value>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * const parser = Parser.choice([Parser.letter, Parser.digit])
 *
 * Parser.run('a1')(parser) // { _tag: 'Success', value: 'a', rest: '1' }
 * Parser.run('1a')(parser) // { _tag: 'Success', value: '1', rest: 'a' }
 */
const choice = <Value>(
  parsers: ReadonlyArray<Parser<Value>>,
): Parser<Value> =>
  (input) => {
    for (const parser of parsers) {
      const result = parser(input)
      if (result._tag === 'Success') return result
    }
    return failure('no alternative matched', input)
  }

/**
 * Runs the parser zero or more times, collecting all results.
 *
 * **Type shape:**
 *
 * `many : Parser<Value> -> Parser<ReadonlyArray<Value>>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.run('aaa1')(Parser.many(Parser.letter))
 * // { _tag: 'Success', value: ['a', 'a', 'a'], rest: '1' }
 */
const many = <Value>(
  parser: Parser<Value>,
): Parser<ReadonlyArray<Value>> =>
  (input) => {
    const out: Array<Value> = []
    let rest = input
    while (true) {
      const result = parser(rest)
      if (result._tag === 'Failure') break
      if (result.rest.length === rest.length) break
      out.push(result.value)
      rest = result.rest
    }
    return success(out, rest)
  }

/**
 * Runs the parser one or more times, collecting all results. Fails if
 * the parser does not match at least once.
 *
 * **Type shape:**
 *
 * `many1 : Parser<Value> -> Parser<ReadonlyArray<Value>>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.run('aaa1')(Parser.many1(Parser.letter))
 * // { _tag: 'Success', value: ['a', 'a', 'a'], rest: '1' }
 *
 * Parser.run('1aa')(Parser.many1(Parser.letter))
 * // { _tag: 'Failure', message: '...', rest: '1aa' }
 */
const many1 = <Value>(
  parser: Parser<Value>,
): Parser<ReadonlyArray<Value>> =>
  (input) => {
    const first = parser(input)
    if (first._tag === 'Failure') return first
    const rest = many(parser)(first.rest)
    if (rest._tag === 'Failure') return rest
    return success([first.value, ...rest.value], rest.rest)
  }

/**
 * Runs two parsers in sequence, returning a tuple of both values.
 *
 * **Type shape:**
 *
 * `sequence2 : (Parser<A>, Parser<B>) -> Parser<readonly [A, B]>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.run('a1')(Parser.sequence2(Parser.letter, Parser.digit))
 * // { _tag: 'Success', value: ['a', '1'], rest: '' }
 */
const sequence2 = <A, B>(
  parserA: Parser<A>,
  parserB: Parser<B>,
): Parser<readonly [A, B]> =>
  (input) => {
    const resultA = parserA(input)
    if (resultA._tag === 'Failure') return resultA
    const resultB = parserB(resultA.rest)
    if (resultB._tag === 'Failure') return resultB
    return success([resultA.value, resultB.value] as const, resultB.rest)
  }

/**
 * Matches a single character satisfying the predicate.
 *
 * **Type shape:**
 *
 * `satisfy : (Predicate<string>, string?) -> Parser<string>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * const vowel = Parser.satisfy(
 *   (c: string) => 'aeiou'.includes(c),
 *   'vowel',
 * )
 *
 * Parser.run('apple')(vowel)
 * // { _tag: 'Success', value: 'a', rest: 'pple' }
 */
const satisfy = (
  predicate: Predicate<string>,
  label = 'character',
): Parser<string> =>
  (input) => {
    if (input.length === 0) {
      return failure(`${label}: unexpected end of input`, input)
    }
    const character = input[0] as string
    return predicate(character)
      ? success(character, input.slice(1))
      : failure(`${label}: unexpected '${character}'`, input)
  }

/**
 * Matches an exact string literal.
 *
 * **Type shape:**
 *
 * `literal : string -> Parser<string>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.run('hello world')(Parser.literal('hello'))
 * // { _tag: 'Success', value: 'hello', rest: ' world' }
 */
const literal = (text: string): Parser<string> =>
  (input) =>
    input.startsWith(text)
      ? success(text, input.slice(text.length))
      : failure(`expected "${text}"`, input)

/**
 * Matches a single decimal digit character.
 *
 * **Type shape:**
 *
 * `digit : Parser<string>`
 */
const digit: Parser<string> = satisfy(
  (character) => character >= '0' && character <= '9',
  'digit',
)

/**
 * Matches a single ASCII letter.
 *
 * **Type shape:**
 *
 * `letter : Parser<string>`
 */
const letter: Parser<string> = satisfy(
  (character) =>
    (character >= 'a' && character <= 'z') ||
    (character >= 'A' && character <= 'Z'),
  'letter',
)

/**
 * Matches a single whitespace character.
 *
 * **Type shape:**
 *
 * `whitespace : Parser<string>`
 */
const whitespace: Parser<string> = satisfy(
  (character) =>
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\r',
  'whitespace',
)

/**
 * Skips any leading whitespace before running the parser.
 *
 * **Type shape:**
 *
 * `trimLeft : Parser<Value> -> Parser<Value>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.run('   123')(Parser.trimLeft(Parser.integer))
 * // { _tag: 'Success', value: 123, rest: '' }
 */
const trimLeft = <Value>(
  parser: Parser<Value>,
): Parser<Value> =>
  (input) => {
    const skipped = many(whitespace)(input)
    return parser(skipped._tag === 'Success' ? skipped.rest : input)
  }

/**
 * Matches a signed integer.
 *
 * **Type shape:**
 *
 * `integer : Parser<number>`
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 *
 * Parser.run('123abc')(Parser.integer)
 * // { _tag: 'Success', value: 123, rest: 'abc' }
 *
 * Parser.run('-42')(Parser.integer)
 * // { _tag: 'Success', value: -42, rest: '' }
 */
const integer: Parser<number> = (input) => {
  const sign = input.startsWith('-') ? '-' : ''
  const body = sign ? input.slice(1) : input
  const digits = many1(digit)(body)
  return digits._tag === 'Failure'
    ? failure('expected integer', input)
    : success(
        parseInt(`${sign}${digits.value.join('')}`, 10),
        digits.rest,
      )
}

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parser combinators for building composable string parsers.
 *
 * A `Parser<Value>` is a function from a string to either a
 * `ParseSuccess<Value>` (with remaining input) or a `ParseFailure`.
 * Parsers compose via `chain` (sequence), `orElse` (choice), and
 * `many` / `many1` (repetition).
 *
 * @example
 * import { Parser } from 'heron-ts/monad/parser'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // Parse "key=value" pairs
 * const keyValue: Parser<{ key: string; value: string }> = pipe(
 *   Parser.many1(Parser.letter),
 *   Parser.chain((keyChars: ReadonlyArray<string>) =>
 *     pipe(
 *       Parser.literal('='),
 *       Parser.chain(() =>
 *         pipe(
 *           Parser.many1(Parser.letter),
 *           Parser.map((valueChars: ReadonlyArray<string>) => ({
 *             key: keyChars.join(''),
 *             value: valueChars.join(''),
 *           })),
 *         )
 *       ),
 *     )
 *   ),
 * )
 *
 * Parser.run('foo=bar')(keyValue)
 * // { _tag: 'Success', value: { key: 'foo', value: 'bar' }, rest: '' }
 */
export const Parser = {
  of,
  fail,
  run,
  isSuccess,
  isFailure,
  map,
  chain,
  orElse,
  choice,
  many,
  many1,
  sequence2,
  satisfy,
  literal,
  digit,
  letter,
  whitespace,
  trimLeft,
  integer,
} as const
