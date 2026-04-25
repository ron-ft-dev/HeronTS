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


  /**
   * 1. Receive a function
   * 2. Count the amount of arguments in the function
   * 3. If the amount of arguments is zero exit
   * 4. If the amount of arguments is one return function
   * 5. If the amount of arguments is more than one
   * 6. separate first argument
   * 7. return a function with the first argument bound and the next arguments waiting
   * 8. repeat until number of arguments is one
   */

export const curry = <F extends (...args: any[]) => any>(fn: F): any => {
  const partial = (...collected: any[]): any => {
    if (collected.length >= fn.length) {
      return fn(...collected)
    }
    return (next: any) => partial(...collected, next)
  }
  return partial
}
