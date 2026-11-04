import {SEARCH_CURVES} from './bfs.js';
export const MEMBERS=Object.freeze([
  {id:'count-linear',language:'Gaussian elimination on rule count differences modulo 2 and 3'},
  {id:'group-full',language:'enumerate symbol homomorphisms into C2..C6, C2xC2, C3xC3, S3, Q8, D4, A4'},
  {id:'group-quotients',language:'same search into all proper quotients of the registered groups'},
  {id:'monoid-csp',language:'backtracking symbol-image CSP over registered finite tables; exhaustive laws, partial rules and examples'},
  {id:'joint-coarse',language:'fit a public finite-table CSP then majority-classify the joint proper-quotient and count tuple'},
  {id:'finite-state',language:'infer complete letter transformations on q=2,3,4 points; retain full product with <=q^q states'},
  {id:'rewrite-normal-form',language:'bounded shortlex-decreasing rewrite normalization'},
  {id:'grammar-cegis',language:'relation-constrained finite fold grammar with public counterexample refinement'},
  {id:'nuisance-stumps',language:'fitted threshold stumps on lengths, histogram L1, edit, LCS, positional agreement and bigram differences'},
  {id:'positional-template',language:'registered ambient templates with their historical generator images at public alphabet positions; free remaining images'},
  ...SEARCH_CURVES.map(b=>({id:'bfs-'+b.name,language:'bounded single-rule FIFO string search',search:b})),
  {id:'bidirectional',language:'bounded two-frontier reversible rewrite search',search:SEARCH_CURVES[0]}
]);
