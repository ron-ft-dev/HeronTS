/**
 * @file     types.ts
 * @location src/prelude/types.ts
 * @brief    Function type primitives used across the library.
 */

/**
 * A function of zero arguments. Used for nullary callbacks.
 *
 * **Type shape:**
 *
 * `Nullary<Output> = () -> Output`
 *
 * @example
 * const thenDo = (callback: Nullary) => callback()
 * const greet: Nullary = () => console.log("I did.")
 * thenDo(greet) // logs "I did."
 */
export type Nullary<Output = void> = () => Output

/**
 * A deferred computation that produces a value when invoked.
 *
 * Semantically equivalent to `Nullary` with different intent:
 * "this is lazy, call it to force evaluation."
 *
 * **Type shape:**
 *
 * `Lazy<Value> = () -> Value`
 *
 * @example
 * const expensive: Lazy<number> = () => 5 + 10
 * expensive() // 15
 */
export type Lazy<Value> = Nullary<Value>

/**
 * A deferred computation that may have side effects.
 *
 * Semantically equivalent to `Nullary` with different intent:
 * "calling this may do something, not just return a value."
 *
 * **Type shape:**
 *
 * `Thunk<Output> = () -> Output`
 *
 * @example
 * const printHello: Thunk = () => console.log("Hello!")
 * printHello() // logs "Hello!"
 */
export type Thunk<Output = void> = Nullary<Output>

/**
 * A function of one argument.
 *
 * The output defaults to the same type as
 * the input.
 *
 * `Unary<number>` means `(x: number) => number`.
 *
 * **Type shape:**
 *
 * `Unary<Input, Output> = Input -> Output`
 *
 * @example
 * const stringify: Unary<number, string> = (x) => `${x}`
 * stringify(10) // "10"
 */
export type Unary<Input, Output = Input> = (x: Input) => Output

/**
 * A function from a type to itself.
 *
 * Semantically equivalent to `Unary<Value, Value>` with different intent:
 * "this transforms a value but preserves its type."
 *
 * **Type shape:**
 *
 * `Endomorphism<Value> = Value -> Value`
 *
 * @example
 * const negate: Endomorphism<number> = (x) => -x
 * negate(5) // -5
 */
export type Endomorphism<Value> = Unary<Value, Value>

/**
 * A function of two arguments.
 *
 * The second input and the output default to the same type as the first input.
 *
 * `Binary<number>` means `(a: number, b: number) => number`.
 *
 * **Type shape:**
 *
 * `Binary<InputA, InputB, Output> = (InputA, InputB) -> Output`
 *
 * @example
 * const add: Binary<number> = (a, b) => a + b
 * add(1, 2) // 3
 */
export type Binary<InputA, InputB = InputA, Output = InputA> = (
  a: InputA,
  b: InputB,
) => Output

/**
 * A function of three arguments.
 *
 * The first input defaults the types of the remaining inputs and the output.
 *
 * `Ternary<number>` means `(a: number, b: number, c: number) => number`.
 *
 * **Type shape:**
 *
 * `Ternary<InputA, InputB, InputC, Output> = (InputA, InputB, InputC) -> Output`
 *
 * @example
 * const addThenMultiply: Ternary<number> = (a, b, c) => (a + b) * c
 * addThenMultiply(1, 2, 3) // 9
 */
export type Ternary<InputA, InputB = InputA, InputC = InputA, Output = InputA> = (
  a: InputA,
  b: InputB,
  c: InputC,
) => Output

/**
 * A function of four arguments.
 *
 * The first input defaults the types of the remaining inputs and the output.
 *
 * This example uses different input/output types to demonstrate the full
 * flexibility. The defaults are convenient but any can be overridden.
 *
 * **Type shape:**
 *
 * `Quaternary<InputA, InputB, InputC, InputD, Output> = (InputA, InputB, InputC, InputD) -> Output`
 *
 * @example
 * const addThenMultiplyAsString: Quaternary<number, number, number, string, string> =
 *   (a, b, multiplier, unit) => `${(a + b) * multiplier}${unit}`
 * addThenMultiplyAsString(1, 2, 3, "L") // "9L"
 */
export type Quaternary<
  InputA,
  InputB = InputA,
  InputC = InputA,
  InputD = InputA,
  Output = InputA,
> = (
  a: InputA,
  b: InputB,
  c: InputC,
  d: InputD,
) => Output

/**
 * A function that returns a boolean.
 *
 * Used for filtering, branching, and validation.
 *
 * **Type shape:**
 *
 * `Predicate<Input> = Input -> boolean`
 *
 * @example
 * const isAdult: Predicate<number> = (x) => x >= 18
 * isAdult(17) // false
 * isAdult(21) // true
 */
export type Predicate<Input = unknown> = Unary<Input, boolean>

/**
 * A type-narrowing predicate.
 *
 * When the function returns `true`, TypeScript narrows `Input` down to `Refined`
 * in the surrounding scope.
 *
 * **Type shape:**
 *
 * `Refinement<Input, Refined> = (x: Input) -> x is Refined`
 *
 * @example
 * const isString: Refinement<unknown, string> =
 *   (x): x is string => typeof x === "string"
 *
 * const value: unknown = "hello"
 * if (isString(value)) {
 *   // value is narrowed to `string` here
 *   value.toUpperCase()
 * }
 */
export type Refinement<Input, Refined extends Input> =
  (x: Input) => x is Refined

/**
 * A nullable value: either present, or `null` / `undefined`.
 *
 * Useful for interop with native JavaScript APIs that use nullability.
 *
 * For an explicit, composable optional type with operations, use the
 * `Maybe` monad in `monad/maybe`.
 *
 * **Type shape:**
 *
 * `Nullable<Value> = Value | null | undefined`
 *
 * @example
 * function findUser(id: number): Nullable<User> {
 *   return users.get(id) ?? null
 * }
 *
 * const result = findUser(42)
 * if (result != null) {
 *   // result is narrowed to User here
 * }
 */
export type Nullable<Value> = Value | null | undefined
