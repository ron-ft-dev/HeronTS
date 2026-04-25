export type Thunk<Output> = () => Output

export type Unary<Input, Output = Input> = (argument: Input) => Output

export type Binary<InputA, InputB = InputA, Output = InputA> = (
  argumentA: InputA,
  argumentB: InputB
) => Output

export type Ternary<InputA, InputB = InputA, InputC = InputA, Output = InputA> = (
  argumentA: InputA,
  argumentB: InputB,
  argumentC: InputC
) => Output

export type Quaternary<InputA, InputB = InputA, InputC = InputA, InputD = InputA, Output = InputA> = (
  argumentA: InputA,
  argumentB: InputB,
  argumentC: InputC,
  argumentD: InputD
) => Output

export type Predicate<Input = unknown> = Unary<Input, Boolean>

export type Maybe<T> = T | null | undefined

export type Ok<Value> = { readonly _tag: 'Ok', readonly value: Value }
export type Err<Error = unknown> = { readonly _tag: 'Err', readonly error: Error }
export type Result<Value, Error> = Ok<Value> | Err<Error>

