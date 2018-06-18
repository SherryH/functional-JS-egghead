// semigroup: a type with a concat() method
// monoid: a semigroup with a special neutral identity element.
// Sum, All are monoid, First is not
// the neutral identity element can act like the default value when none is found
// monoid makes program failsafe

const { List } = require("immutable-ext");
const { fromNullable } = require("./lib");

// Sum can be promoted to a monoid because Sum.empty() => Sum(0) exists
// Sum(1).concat(Sum(0)) = Sum(1), Sum(5).concat(Sum(0)) => Sum(5)
const Sum = x => ({
  x: x,
  concat: ({ x: val }) => Sum(x + val),
  inspect: () => `Sum(${x})`
  // empty: () => Sum(0)
});
Sum.empty = () => Sum(0);
const res = Sum.empty()
  .concat(Sum(1))
  .concat(Sum(44));

console.log(`Sum.empty().concat(Sum(1)).concat(Sum(44)) : `, res);

// All can be promoted to a monoid
// All(true).concat(All(true)) = All(true)
// All(false).concat(All(true)) = All(false)
const All = x => ({
  x,
  concat: ({ x: val }) => All(x && val),
  inspect: () => `All(${x})`
});
All.empty = () => All(true);

const resAll = All.empty()
  .concat(All(true))
  .concat(All(true))
  .concat(All.empty());

console.log(
  `All.empty().concat(All(true)).concat(All(true)).concat(All.empty()) : `,
  resAll
);

// First cannot be promoted to Monoid!
const First = x => ({
  x,
  // throw away the arg and keep our First
  concat: _ => First(x),

  // custom getter used by console.log
  inspect: _ => `First(${x})`
});

// Max can be a monoid too
const Max = x => ({
  x,
  concat: ({ x: val }) => Max(x > val ? x : val),
  inspect: _ => `Max(${x})`
});
Max.empty = () => Max(-Infinity);

// testing
console.log("Max(4).concat(Max(5)) : ", Max(4).concat(Max(5)));

console.log(
  "Max(4).concat(Max(5)).concat(Max(7)) : ",
  Max(4)
    .concat(Max(5))
    .concat(Max(7))
);

console.log(
  "Max.empty().concat(Max(4)).concat(Max(5)).concat(Max(7)) : ",
  Max.empty()
    .concat(Max(4))
    .concat(Max(5))
    .concat(Max(7))
);

// Wrap semigroup into Either

// Some semigroups are monoid - failsafe, some are not (Left vs Right)
// X is a semigroup here
const Right = X => ({});
// const Right = x => ({
//   // f has lifted values
//   chain: f => f(x),

//   // assumes x is a lifted function
//   ap: other => other.map(x),
//   traverse: (of, f) => f(x).map(Right),
//   fold: (f, g) => g(x),
//   map: f => Right(f(x)),
//   concat: o =>
//     o.fold(
//       err => Left(err),

//       // use the concat for x
//       res => Right(x.concat(res))
//     ),
//   isLeft: false,
//   inspect: _ => `Right(${x})`
// });

const Left = x => ({
  chain: f => f(x),

  // Left ignores apply
  ap: other => Left(x),
  traverse: (of, f) => of(Left(x)),
  fold: (f, g) => f(x),

  // ignore f when apply to Left
  map: f => Left(x),

  // ignore concat when apply to Left
  concat: o => o.fold(_ => Left(x), y => o),
  isLeft: true,
  inspect: _ => `Left(${x})`
});

const stats = List.of(
  { page: "Home", views: 40 },
  { page: "About", views: 10 },
  { page: "Blog", views: 4 }
);
const totalStats = stats.foldMap(x => Sum(x.views), Sum(0));
console.log(`totalStats : `, totalStats);

// Wrap Either into First
const FirstEither = either => ({
  fold: f => f(either),
  concat: o => (either.isLeft ? o : FirstEither(either)),
  inspect: _ => `FirstEither(${either.inspect()})`
});
FirstEither.empty = _ => FirstEither(Left());

// testing
console.log(
  `FirstEither.empty().concat(FirstEither(Right(55))) : `,
  FirstEither.empty().concat(FirstEither(Right(55)))
);
console.log(
  `FirstEither(Right(111)).concat(FirstEither(Right(55))) : `,
  FirstEither(Right(111)).concat(FirstEither(Right(55)))
);

const find = (xs, f) =>
  List(xs)
    .foldMap(x => FirstEither(f(x) ? Right(x) : Left()), FirstEither.empty())
    .fold(x => x);

// testing
console.log(
  `find([3,4,5,6,7], x => x > 4) : `,
  find([3, 4, 5, 6, 7], x => x > 4)
);
// => Right(5)

const sum = xs => xs.reduce((acc, x) => acc + x, 0);

const all = xs => xs.reduce((acc, x) => acc && x, true);

const first = xs => xs.reduce((acc, x) => acc);

console.log(`sum([1,3,4]) : `, sum([1, 3, 4]));
console.log(`all([true, false, true]) : `, all([true, false, true]));

// unsafe if empty array is provided,
// because no Monoid structure
console.log(`first([1,3,4]) : `, first([1, 3, 4]));
