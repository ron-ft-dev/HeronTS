/**
 * @file     index.ts
 * @location src/index.ts
 * @brief    Public API surface for heron-ts.
 *
 * Prelude utilities are exported flat — they are general-purpose
 * combinators and type primitives used directly at call sites.
 *
 * Monads are exported as namespace objects — operations are accessed
 * via `Maybe.map`, `Result.chain`, etc. to keep call sites unambiguous
 * when multiple monads are in scope.
 *
 * Deep imports are also available for consumers who want per-file
 * tree-shaking:
 *   import { Maybe } from 'heron-ts/monad/maybe'
 *   import { pipe } from 'heron-ts/prelude/pipe'
 */

// ─────────────────────────────────────────────────────────────────────────────
// Prelude — exported flat
// ─────────────────────────────────────────────────────────────────────────────

export {
  identity,
} from './prelude/identity'

export {
  constant,
} from './prelude/constant'

export {
  pipe,
} from './prelude/pipe'

export {
  flow,
} from './prelude/flow'

export {
  isNull,
  isUndefined,
  isNullable,
  isDefined,
} from './prelude/guard'

export {
  stringMonoid,
  arrayMonoid,
  sumMonoid,
  productMonoid,
  allMonoid,
  anyMonoid,
} from './prelude/monoid'

export type {
  Nullary,
  Lazy,
  Thunk,
  Unary,
  Binary,
  Ternary,
  Quaternary,
  Endomorphism,
  Predicate,
  Refinement,
  Nullable,
} from './prelude/types'

export type {
  Monoid,
} from './prelude/monoid'

// ─────────────────────────────────────────────────────────────────────────────
// Monads — exported as namespace objects
// ─────────────────────────────────────────────────────────────────────────────

export {
  Continuation,
} from './monad/continuation'

export type {
  Continuation as ContinuationType,
  Escape,
  WithEscape,
} from './monad/continuation'

export {
  Maybe,
} from './monad/maybe'

export type {
  Maybe as MaybeType,
  Some,
  None,
  MaybeHandlers,
} from './monad/maybe'

export {
  Result,
  ok,
  err,
} from './monad/result'

export type {
  Result as ResultType,
  Ok,
  Err,
  ResultHandlers,
} from './monad/result'

export {
  Either,
  left,
  right,
} from './monad/either'

export type {
  Either as EitherType,
  Left,
  Right,
  EitherHandlers,
} from './monad/either'

export {
  Identity,
} from './monad/identity'

export type {
  Identity as IdentityType,
} from './monad/identity'

export {
  IO,
} from './monad/io'

export type {
  IO as IOType,
} from './monad/io'

export {
  Reader,
} from './monad/reader'

export type {
  Reader as ReaderType,
} from './monad/reader'

export {
  State,
} from './monad/state'

export type {
  State as StateType,
} from './monad/state'

export {
  Writer,
} from './monad/writer'

export type {
  Writer as WriterType,
} from './monad/writer'

export {
  List,
} from './monad/list'

export type {
  List as ListType,
} from './monad/list'

export {
  Tree,
  node,
  leaf,
} from './monad/tree'

export type {
  Tree as TreeType,
} from './monad/tree'

export {
  Logic,
} from './monad/logic'

export type {
  Logic as LogicType,
} from './monad/logic'

export {
  Task,
} from './monad/task'

export type {
  Task as TaskType,
} from './monad/task'

export {
  Distribution,
} from './monad/distribution'

export type {
  Distribution as DistributionType,
} from './monad/distribution'

export {
  Parser,
} from './monad/parser'

export type {
  Parser as ParserType,
  ParseResult,
  ParseSuccess,
  ParseFailure,
} from './monad/parser'

export {
  Observable,
} from './monad/observable'

export type {
  Observable as ObservableType,
  Observer,
  Unsubscribe,
} from './monad/observable'
