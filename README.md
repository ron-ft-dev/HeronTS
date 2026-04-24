# Heron-TS

A small TypeScript utility library for functional programming.
Handle optional values without null checks and model errors as values
rather than exceptions. This is meant for personal use but feel free to use
for own projects.

## Installation

\```
npm install heron-ts
\```

## Overview

Heron-TS modules:

- **`fn`** - Function composition with `pipe` and `flow`
- **`maybe`** - Handle optional values without null checks
- **`result`** - Handle operations that can fail without throwing exceptions

## API

### fn

\```ts
import { fn } from 'heron-ts'
import type { Unary, Binary, Ternary, Thunk, Predicate } from 'heron-ts'

// pipe — pass a value through functions left to right
fn.pipe(3, double, increment) // 7

// flow — compose functions into a single reusable function
const transform = fn.flow(double, increment)
transform(3) // 7

// identity — returns the value unchanged
fn.identity(42) // 42

// always — returns a function that always returns the same value
const alwaysFive = fn.always(5)
alwaysFive() // 5
\```

### maybe

\```ts
import { maybe } from 'heron-ts'
import type { Maybe } from 'heron-ts'

const getUser = (): Maybe<string> => null

pipe(
  getUser(),
  maybe.map(name => name.toUpperCase()),
  maybe.filter(name => name.length > 3),
  maybe.getOrElse(() => 'Anonymous')
) // 'Anonymous'
\```

| Function | Description |
|---|---|
| `fromNullable` | Convert a nullable value into a `Maybe` |
| `map` | Transform the value if it exists |
| `flatMap` | Transform with a function that also returns a `Maybe` |
| `filter` | Return nothing if the value fails a predicate |
| `getOrElse` | Extract the value with a fallback thunk |
| `orElse` | Recover with a fallback `Maybe` |
| `fold` | Branch into two paths, one for value one for nothing |
| `tap` | Run a side effect without changing the value |

### result

\```ts
import { result } from 'heron-ts'
import type { Result } from 'heron-ts'

const parseAge = (value: string): Result<number, string> =>
  isNaN(Number(value)) ? result.err('not a number') : result.ok(Number(value))

pipe(
  parseAge('25'),
  result.map(age => age >= 18),
  result.fold(
    isAdult => isAdult ? 'Welcome' : 'Too young',
    error => `Failed: ${error}`
  )
) // 'Welcome'
\```

| Function | Description |
|---|---|
| `ok` | Construct an Ok result |
| `err` | Construct an Err result |
| `fromNullable` | Convert a nullable value into a `Result` |
| `map` | Transform the Ok value |
| `mapError` | Transform the Err value |
| `flatMap` | Transform Ok with a function that also returns a `Result` |
| `flatMapError` | Transform Err with a function that also returns a `Result` |
| `getOrElse` | Extract the Ok value with an error-aware fallback |
| `orElse` | Recover from Err with a fallback `Result` |
| `fold` | Merge both rails into a single value |
| `tap` | Run a side effect on Ok without changing the result |
| `tapError` | Run a side effect on Err without changing the result |

### guard

\```ts
import { guard } from 'heron-ts'

guard.isNull(null)        // true
guard.isUndefined(undefined) // true
guard.isNullable(null)    // true
guard.isDefined(42)       // true
guard.isOk(result.ok(42)) // true
guard.isErr(result.err('failed')) // true
\``

## License

MIT
