// identity functor
const Box = x =>
  // container object wrapping x
  ({
    // Now x is available in the closure instead of 'this'

    // functor map, sends f:a->b into map(f):Box(a)->Box(b),
    // the same as f(x) but wrapped into the Box container,
    // so we can keep chaining
    map: f => Box(f(x)),

    // not part of functor spec
    // applies f and returns the raw unwrapped value,
    // sends f:a->b into fold(f):Box(a)->b,
    // does not return any Box container, so can't be chained with map
    fold: f => f(x),

    // custom getter function -- called by console.log
    inspect: () => (x.inspect ? `Box(${x.inspect()})` : `Box(${x})`)
  });

// String => Box(String)
const moneyToFloat1 = str =>
  Box(str)
    .map(s => s.replace(/\$/g, ""))
    .map(r => parseFloat(r));
// .fold(r => parseFloat(r))

// String => Box(String)
const percentToFloat1 = str =>
  Box(str.replace(/\%/g, ""))
    .map(replaced => parseFloat(replaced))
    .map(number => number * 0.01);
// .fold(number => number * 0.01)

// function of 2 arguments!
// need to .fold twice to get back the value
const applyDiscount1 = (price, discount) =>
  // already in container Box,
  // otherwise we would need to wrap it as Box(moneyToFloat1(price))
  moneyToFloat1(price)
    // no further chaining, so get the value
    .fold(cost =>
      // pick the 2nd argument
      percentToFloat1(discount)
        // also here get the value
        .fold(
          savings =>
            // cost is available in the closure
            // as result of previous calculations
            cost - cost * savings
        )
    );

// without fold, result is wrapped into Box twice
const applyDiscount1InBox = (price, discount) =>
  moneyToFloat1(price).map(cost =>
    // nesting so cost remains in scope
    percentToFloat1(discount).map(savings => cost - cost * savings)
  );

console.log(`moneyToFloat1(' $33 ') : `, moneyToFloat1(" $33 ")); //=> Box(33)
console.log(`percentToFloat1(' 1.23% ') : `, percentToFloat1(" 1.23% ")); //=> Box(0.0123)

const result = applyDiscount1("$55", "20%");

console.log(`applyDiscount1('$55', '20%') : `, result); //=> 44

console.log(
  `applyDiscount1InBox('$55', '20%') : `,
  applyDiscount1InBox("$55", "20%")
); //=> Box(Box(44))

//============
// stripped off the $ sign and convert to a float
const moneyToFloat2 = str => parseFloat(str.replace(/\$/g, ""));

// change a percentage to a float number
const percentToFloat2 = str => {
  const replaced = str.replace(/\%/g, "");
  const number = parseFloat(replaced);
  return number * 0.01;
};

// convert cost '$100' to 100
// convert discount '20%' to 0.2
// return discounted price
const applyDiscount2 = (price, discount) => {
  const cost = moneyToFloat2(price);
  const savings = percentToFloat2(discount);
  return cost - cost * savings;
};

// use Box to chain the operations so applyDiscount looks like below
/*
const applyDiscount = (price, discount) =>
  Box(moneyToFloat(price))
  .fold(cost =>
    percentToFloat(discount)
    .fold(savings =>
      cost - cost * savings))
*/

const moneyToFloat = str =>
  Box(str)
    .map(() => str.replace(/\$/g, ""))
    .map(s => parseFloat(s));

const percentToFloat = str =>
  Box(str)
    .map(() => str.replace(/\%/g, ""))
    .map(replaced => parseFloat(replaced) * 0.01);

const applyDiscount = (price, discount) =>
  moneyToFloat(price).fold(cost =>
    percentToFloat(discount).fold(savings => cost - cost * savings)
  );

console.log("My try", applyDiscount("$100", "20%"));
