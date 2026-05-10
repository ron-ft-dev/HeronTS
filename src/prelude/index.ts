/**
 * @file     index.ts
 * @location src/prelude/index.ts
 * @brief    Re-exports all prelude utilities as a single public surface.
 */

export {
  identity,
} from './identity'

export {
  constant,
} from './constant'

export {
  pipe,
} from './pipe'

export {
  flow,
} from './flow'

export {
  isNull,
  isUndefined,
  isNullable,
  isDefined,
} from './guard'

export {
  stringMonoid,
  arrayMonoid,
  sumMonoid,
  productMonoid,
  allMonoid,
  anyMonoid,
} from './monoid'

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
} from './types'

export type {
  Monoid,
} from './monoid'
