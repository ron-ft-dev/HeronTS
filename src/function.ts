import type { Thunk, Unary } from "./type"

export const identity = <T>(value: T): T => value

export const always = <T>(value: T): Thunk<T> => () => value

// Eager evaluation of series of functions on a value.
export const pipe = <Input, Output>(
  value: Input,
  ...functions: Array<Unary<any, any>>
): Output => functions.reduce((current, fn) => fn(current), value as any) as Output

// Lazy evaluation of series of functions expecting a value.
export const flow = <Input, Output>(...functions: Array<Unary<any, any>>)
  : Unary<Input, Output> => (value: Input) =>
    functions.reduce((current, fn) => fn(current), value as any) as Output

