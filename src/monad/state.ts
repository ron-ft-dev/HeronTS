/**
 * @file     state.ts
 * @location src/monad/state.ts
 * @brief    The State monad for pure stateful computations.
 */

import type { Unary } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A `State<StateType, Value>` is a pure function from an input state to
 * a tuple of a new state and a produced value. It threads mutable state
 * through a computation without actually mutating anything.
 *
 * **Type shape:**
 *
 * `State<StateType, Value> = (state: StateType) -> readonly [StateType, Value]`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 * import { pipe } from 'heron-ts/prelude'
 *
 * type Counter = number
 *
 * const increment: State<Counter, void> = State.modify((n: Counter) => n + 1)
 * const getCount: State<Counter, Counter> = State.get()
 *
 * const program = pipe(
 *   increment,
 *   State.chain(() => increment),
 *   State.chain(() => getCount),
 * )
 *
 * State.run(0)(program)
 * // readonly [2, 2] — state is 2, value is 2
 */
export type State<StateType, Value> =
  (state: StateType) => readonly [StateType, Value]

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into `State`. Passes the state through unchanged.
 *
 * **Type shape:**
 *
 * `of : Value -> State<StateType, Value>`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 *
 * State.run(0)(State.of(42))
 * // readonly [0, 42] — state unchanged, value is 42
 */
const of = <StateType, Value>(
  value: Value,
): State<StateType, Value> =>
  (state) => [state, value]

/**
 * Executes a `State` computation with an initial state, returning both
 * the final state and the produced value.
 *
 * **Type shape:**
 *
 * `run : StateType -> State<StateType, Value> -> readonly [StateType, Value]`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 *
 * State.run(0)(State.of(42))
 * // readonly [0, 42]
 */
const run = <StateType, Value>(
  initialState: StateType,
) =>
  (computation: State<StateType, Value>): readonly [StateType, Value] =>
    computation(initialState)

/**
 * Executes a `State` computation and returns only the produced value,
 * discarding the final state.
 *
 * **Type shape:**
 *
 * `evaluate : StateType -> State<StateType, Value> -> Value`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 *
 * State.evaluate(0)(State.of(42)) // 42
 */
const evaluate = <StateType, Value>(
  initialState: StateType,
) =>
  (computation: State<StateType, Value>): Value =>
    computation(initialState)[1]

/**
 * Executes a `State` computation and returns only the final state,
 * discarding the produced value.
 *
 * **Type shape:**
 *
 * `execute : StateType -> State<StateType, Value> -> StateType`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 *
 * State.execute(0)(State.modify((n: number) => n + 1))
 * // 1
 */
const execute = <StateType, Value>(
  initialState: StateType,
) =>
  (computation: State<StateType, Value>): StateType =>
    computation(initialState)[0]

/**
 * Transforms the produced value without changing the state threading.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> State<StateType, Value> -> State<StateType, Mapped>`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   State.get<number>(),
 *   State.map((n: number) => `Count: ${n}`),
 *   State.run(5),
 * )
 * // readonly [5, 'Count: 5']
 */
const map = <StateType, Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (computation: State<StateType, Value>): State<StateType, Mapped> =>
    (state) => {
      const [nextState, value] = computation(state)
      return [nextState, transform(value)]
    }

/**
 * Sequences two `State` computations. The result of the first is passed
 * to a function that produces the second, threading state through both.
 *
 * **Type shape:**
 *
 * `chain : (Value -> State<StateType, Next>) -> State<StateType, Value> -> State<StateType, Next>`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const push = (value: number): State<number[], void> =>
 *   State.modify((stack: number[]) => [...stack, value])
 *
 * pipe(
 *   push(1),
 *   State.chain(() => push(2)),
 *   State.chain(() => push(3)),
 *   State.run([]),
 * )
 * // readonly [[1, 2, 3], undefined]
 */
const chain = <StateType, Value, Next>(
  next: Unary<Value, State<StateType, Next>>,
) =>
  (computation: State<StateType, Value>): State<StateType, Next> =>
    (state) => {
      const [nextState, value] = computation(state)
      return next(value)(nextState)
    }

/**
 * Applies a `State`-wrapped function to a `State`-wrapped value,
 * threading state through both.
 *
 * **Type shape:**
 *
 * `apply : State<StateType, (Value -> Mapped)> -> State<StateType, Value> -> State<StateType, Mapped>`
 */
const apply = <StateType, Value, Mapped>(
  stateOfFunction: State<StateType, Unary<Value, Mapped>>,
) =>
  (computation: State<StateType, Value>): State<StateType, Mapped> =>
    (state) => {
      const [state1, transform] = stateOfFunction(state)
      const [state2, value] = computation(state1)
      return [state2, transform(value)]
    }

/**
 * Returns the current state as the produced value, leaving it unchanged.
 *
 * **Type shape:**
 *
 * `get : () -> State<StateType, StateType>`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 *
 * State.run(42)(State.get()) // readonly [42, 42]
 */
const get = <StateType>(): State<StateType, StateType> =>
  (state) => [state, state]

/**
 * Replaces the state with a new value, producing `undefined`.
 *
 * **Type shape:**
 *
 * `put : StateType -> State<StateType, void>`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 *
 * State.run(0)(State.put(99)) // readonly [99, undefined]
 */
const put = <StateType>(
  newState: StateType,
): State<StateType, void> =>
  () => [newState, undefined]

/**
 * Applies a function to the state, producing `undefined`.
 *
 * **Type shape:**
 *
 * `modify : (StateType -> StateType) -> State<StateType, void>`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 *
 * State.run(5)(State.modify((n: number) => n * 2))
 * // readonly [10, undefined]
 */
const modify = <StateType>(
  transform: Unary<StateType, StateType>,
): State<StateType, void> =>
  (state) => [transform(state), undefined]

/**
 * Projects a value from the current state without changing it.
 *
 * **Type shape:**
 *
 * `gets : (StateType -> Value) -> State<StateType, Value>`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 *
 * type AppState = { readonly count: number; readonly name: string }
 *
 * State.run({ count: 5, name: 'Alice' })(
 *   State.gets((s: AppState) => s.name),
 * )
 * // readonly [{ count: 5, name: 'Alice' }, 'Alice']
 */
const gets = <StateType, Value>(
  project: Unary<StateType, Value>,
): State<StateType, Value> =>
  (state) => [state, project(state)]

/**
 * Runs a `ReadonlyArray<State<StateType, Value>>` in sequence, threading
 * state through each computation and collecting all produced values.
 *
 * **Type shape:**
 *
 * `sequence : ReadonlyArray<State<StateType, Value>> -> State<StateType, ReadonlyArray<Value>>`
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 *
 * const computations = [
 *   State.modify((n: number) => n + 1),
 *   State.modify((n: number) => n + 1),
 *   State.modify((n: number) => n + 1),
 * ]
 *
 * State.run(0)(State.sequence(computations))
 * // readonly [3, [undefined, undefined, undefined]]
 */
const sequence = <StateType, Value>(
  computations: ReadonlyArray<State<StateType, Value>>,
): State<StateType, ReadonlyArray<Value>> =>
  (initialState) => {
    let currentState = initialState
    const values: Array<Value> = []
    for (const computation of computations) {
      const [nextState, value] = computation(currentState)
      currentState = nextState
      values.push(value)
    }
    return [currentState, values]
  }

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `State` monad for pure stateful computations.
 *
 * A `State<StateType, Value>` threads a piece of state through a
 * computation without mutation. Use `State.run` to supply the initial
 * state and extract the result.
 *
 * @example
 * import { State } from 'heron-ts/monad/state'
 * import { pipe } from 'heron-ts/prelude'
 *
 * type Stack = ReadonlyArray<number>
 *
 * const push = (value: number): State<Stack, void> =>
 *   State.modify((stack: Stack) => [...stack, value])
 *
 * const pop: State<Stack, number> = (stack) =>
 *   [stack.slice(0, -1), stack[stack.length - 1] ?? 0]
 *
 * const program = pipe(
 *   push(1),
 *   State.chain(() => push(2)),
 *   State.chain(() => push(3)),
 *   State.chain(() => pop),
 * )
 *
 * State.run([])(program)
 * // readonly [[1, 2], 3]
 */
export const State = {
  of,
  run,
  evaluate,
  execute,
  map,
  chain,
  apply,
  get,
  put,
  modify,
  gets,
  sequence,
} as const
