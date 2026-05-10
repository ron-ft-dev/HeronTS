/**
 * @file     tree.ts
 * @location src/monad/tree.ts
 * @brief    The Tree monad for rose-tree-shaped data.
 */

import type { Unary } from '../prelude/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A `Tree<Value>` is a rose tree: every node carries a `Value` and a
 * (possibly empty) list of child `Tree<Value>` nodes.
 *
 * `map` transforms every node's value. `chain` substitutes each node
 * with a whole subtree, grafting the original children onto the new
 * subtree's root.
 *
 * **Type shape:**
 *
 * `Tree<Value> = { value: Value, children: ReadonlyArray<Tree<Value>> }`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 *
 * const tree = Tree.node(1, [
 *   Tree.leaf(2),
 *   Tree.node(3, [Tree.leaf(4)]),
 * ])
 *
 * Tree.flatten(tree) // [1, 2, 3, 4]
 */
export type Tree<Value> = {
  readonly value: Value
  readonly children: ReadonlyArray<Tree<Value>>
}

// ─────────────────────────────────────────────────────────────────────────────
// Constructors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constructs a `Tree` node with a value and children.
 *
 * **Type shape:**
 *
 * `node : (Value, ReadonlyArray<Tree<Value>>) -> Tree<Value>`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 *
 * Tree.node(1, [Tree.leaf(2), Tree.leaf(3)])
 * // { value: 1, children: [{ value: 2, children: [] }, { value: 3, children: [] }] }
 */
export const node = <Value>(
  value: Value,
  children: ReadonlyArray<Tree<Value>> = [],
): Tree<Value> => ({ value, children })

/**
 * Constructs a `Tree` leaf — a node with no children.
 *
 * **Type shape:**
 *
 * `leaf : Value -> Tree<Value>`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 *
 * Tree.leaf(5) // { value: 5, children: [] }
 */
export const leaf = <Value>(value: Value): Tree<Value> =>
  node(value, [])

// ─────────────────────────────────────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifts a plain value into `Tree`. Equivalent to `leaf`.
 *
 * **Type shape:**
 *
 * `of : Value -> Tree<Value>`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 *
 * Tree.of(5) // { value: 5, children: [] }
 */
const of = leaf

/**
 * Transforms every node's value in the tree.
 *
 * **Type shape:**
 *
 * `map : (Value -> Mapped) -> Tree<Value> -> Tree<Mapped>`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 * import { pipe } from 'heron-ts/prelude'
 *
 * pipe(
 *   Tree.node(1, [Tree.leaf(2), Tree.leaf(3)]),
 *   Tree.map((n: number) => n * 2),
 * )
 * // { value: 2, children: [{ value: 4, ... }, { value: 6, ... }] }
 */
const map = <Value, Mapped>(
  transform: Unary<Value, Mapped>,
) =>
  (tree: Tree<Value>): Tree<Mapped> =>
    node(
      transform(tree.value),
      tree.children.map(map(transform)),
    )

/**
 * Substitutes each node's value with a whole subtree, grafting the
 * original children onto the new subtree's root.
 *
 * **Type shape:**
 *
 * `chain : (Value -> Tree<Next>) -> Tree<Value> -> Tree<Next>`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 * import { pipe } from 'heron-ts/prelude'
 *
 * // Replace each node with a subtree of [n, n*2]
 * pipe(
 *   Tree.node(1, [Tree.leaf(2)]),
 *   Tree.chain((n: number) => Tree.node(n, [Tree.leaf(n * 10)])),
 * )
 * // { value: 1, children: [{ value: 10, children: [] }, { value: 2, children: [{ value: 20, children: [] }] }] }
 */
const chain = <Value, Next>(
  next: Unary<Value, Tree<Next>>,
) =>
  (tree: Tree<Value>): Tree<Next> => {
    const subtree = next(tree.value)
    return node(subtree.value, [
      ...subtree.children,
      ...tree.children.map(chain(next)),
    ])
  }

/**
 * Collapses a tree to a single value bottom-up. Also known as a
 * catamorphism or fold.
 *
 * **Type shape:**
 *
 * `fold : ((Value, ReadonlyArray<Accumulator>) -> Accumulator) -> Tree<Value> -> Accumulator`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 *
 * const sumTree = Tree.fold(
 *   (value: number, childResults: ReadonlyArray<number>) =>
 *     value + childResults.reduce((a, b) => a + b, 0)
 * )
 *
 * sumTree(Tree.node(1, [Tree.leaf(2), Tree.node(3, [Tree.leaf(4)])]))
 * // 10
 */
const fold = <Value, Accumulator>(
  combine: (
    value: Value,
    childResults: ReadonlyArray<Accumulator>,
  ) => Accumulator,
) =>
  (tree: Tree<Value>): Accumulator =>
    combine(tree.value, tree.children.map(fold(combine)))

/**
 * Returns all values in the tree in depth-first preorder.
 *
 * **Type shape:**
 *
 * `flatten : Tree<Value> -> ReadonlyArray<Value>`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 *
 * Tree.flatten(Tree.node(1, [Tree.leaf(2), Tree.node(3, [Tree.leaf(4)])]))
 * // [1, 2, 3, 4]
 */
const flatten = <Value>(tree: Tree<Value>): ReadonlyArray<Value> => {
  const out: Array<Value> = [tree.value]
  for (const child of tree.children) {
    out.push(...flatten(child))
  }
  return out
}

/**
 * Returns the total number of nodes in the tree.
 *
 * **Type shape:**
 *
 * `size : Tree<Value> -> number`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 *
 * Tree.size(Tree.node(1, [Tree.leaf(2), Tree.node(3, [Tree.leaf(4)])]))
 * // 4
 */
const size = <Value>(tree: Tree<Value>): number =>
  1 + tree.children.reduce((sum, child) => sum + size(child), 0)

/**
 * Returns the length of the longest root-to-leaf path. A single-node
 * tree has depth 1.
 *
 * **Type shape:**
 *
 * `depth : Tree<Value> -> number`
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 *
 * Tree.depth(Tree.leaf(1))                              // 1
 * Tree.depth(Tree.node(1, [Tree.leaf(2), Tree.leaf(3)])) // 2
 */
const depth = <Value>(tree: Tree<Value>): number =>
  tree.children.length === 0
    ? 1
    : 1 + Math.max(...tree.children.map(depth))

// ─────────────────────────────────────────────────────────────────────────────
// Namespace
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `Tree` monad for rose-tree-shaped data.
 *
 * A `Tree<Value>` is a node with a value and a list of child trees.
 * `map` transforms every node; `chain` substitutes each node with a
 * whole subtree.
 *
 * @example
 * import { Tree } from 'heron-ts/monad/tree'
 * import { pipe } from 'heron-ts/prelude'
 *
 * const tree = Tree.node(1, [
 *   Tree.leaf(2),
 *   Tree.node(3, [Tree.leaf(4), Tree.leaf(5)]),
 * ])
 *
 * pipe(tree, Tree.map((n: number) => n * 2), Tree.flatten)
 * // [2, 4, 6, 8, 10]
 */
export const Tree = {
  of,
  node,
  leaf,
  map,
  chain,
  fold,
  flatten,
  size,
  depth,
} as const
