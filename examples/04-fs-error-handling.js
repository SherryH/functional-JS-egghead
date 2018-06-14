// const fs = require('fs')ß

const Right = x => ({
  // like map but returns "unboxed" value
  chain: f => f(x),

  // Right applies f to x
  map: f => Right(f(x)),

  // applies the function on the right and returns raw value
  fold: (f, g) => g(x),

  // custom getter function -- called by console.log
  inspect: () => `Right(${x})`
});

const Left = x => ({
  chain: f => Left(x),

  // Left ignores f, simply passes x itself
  map: f => Left(x),

  // applies the function on the left and returns raw value
  fold: (f, g) => f(x),

  // custom getter function -- called by console.log
  inspect: () => `Left(${x})`
});

const fs = require("fs");

const getPort = () => {
  try {
    // read the config.json file
    const configStr = fs.readFileSync("config.json");
    // parse into JSON
    const config = JSON.parse(configStr);
    // return the port num in config.json
    return config.port;
  } catch (e) {
    // failed to open the JSON file
    // return 3000
    return 3000;
  }
};

console.log("getPort", getPort());

// to use Either for the try/catch
const tryCatch = f => {
  try {
    return Right(f());
  } catch (e) {
    return Left(e);
  }
};

// so the resulting getPort looks like below
const getPortFunctional = () =>
  tryCatch(() => fs.readFileSync("config.json"))
    .map(c => JSON.parse(c))
    .fold(e => 3000, c => c.port);

console.log("functional getPort", getPortFunctional());

// in order to catch error if the error happens inside the JSON.parse
const getPortFunctional2tryCatch = () =>
  tryCatch(() => fs.readFileSync("configBad.json"))
    .map(c => tryCatch(() => JSON.parse(c))) // another tryCatch here, Right(f())
    .fold(e => 3000, c => c.port + `${c}Right()`); // returns undefined[object object]Right()

console.log("functional 2 try catch getPort", getPortFunctional2tryCatch());

// therefore we need to use chain to remove one level of Right/Left
const getPortChain1 = () =>
  tryCatch(() => fs.readFileSync("configBad.json"))
    .map(c => tryCatch(() => JSON.parse(c))) // another tryCatch here, Right(f())
    .chain(c => c)
    .fold(e => 3000, c => c.port + `${c}Right()`); // return 3000

console.log("chain1", getPortChain1());

const getPortChain2 = () =>
  tryCatch(() => fs.readFileSync("configBad.json"))
    .chain(c => tryCatch(() => JSON.parse(c))) // another tryCatch here, Right(f())
    .fold(e => 3000, c => c.port + `${c}Right()`); // return 3000

console.log("chain2", getPortChain2());

// // ensure null will always go Left
// const fromNullable = x =>
//   x != null ? Right(x) : Left(null)

// // encapsulate try/catch only here
// const tryCatch = f => {
//   try {
//     return Right(f())
//   } catch (e) {
//     return Left(e)
//   }
// }

// const getPort = fileName =>

//   // this will not "explode" if fileName is not found!
//   tryCatch( () => fs.readFileSync(fileName) )
//     .map( c => JSON.parse(c) )

//     // .map(c => tryCatch(() => JSON.parse(c)))
//     .fold(

//       // default port in case of error
//       e => 3000,
//       c => c.port
//     )

// // no file passed
// console.log(`getPort() : `, getPort()) //=> 3000

// // file not present
// console.log(`getPort('con.json') : `, getPort('con.json')) //=> 3000

// // file present
// console.log(`getPort('config.json') : `, getPort('config.json')) //=> 8080

// // protecting against further errors by wrapping into tryCatch
// const getPortSafe = fileName =>
//   tryCatch( () => fs.readFileSync(fileName) )
//   .chain( c => tryCatch(() => JSON.parse(c)) )
//   .fold(
//     e => 3000,
//     c => c.port
//   )

// console.log(`getPortSafe() : `, getPortSafe()) //=> 3000
// console.log(`getPortSafe('con.json') : `, getPortSafe('con.json')) //=> 3000

// // importing badly formatted file
// console.log(`getPortSafe('configBad.json') : `, getPortSafe('configBad.json')) //=> 3000
// console.log(`getPortSafe('config.json') : `, getPortSafe('config.json')) //=> 8080
