const minstache = require('minstache');

let execute = `
(function javascript () {
  let nightmare = window["{{code}}"];
  try {
    var fn = ({{!src}}), 
      response, 
      args = [];

    {{#args}}args.push({{!argument}});{{/args}}

    if(fn.length - 1 == args.length) {
      args.push(((err, v) => {
          if(err) return nightmare.reject(err);
          nightmare.resolve(v);
        }));
      fn.apply(null, args);
    } 
    else {
      response = fn.apply(null, args);
      if(response && response.then) {
        response.then((v) => {
          nightmare.resolve(v);
        })
        .catch((err) => {
          nightmare.reject(err)
        });
      } else {
        nightmare.resolve(response);
      }
    }
  } catch (err) {
    nightmare.reject(err);
  }
})()
`;

let inject = `
(function javascript () {
  var nightmare = window["{{code}}"];
  try {
    var response = (function () { {{!src}} \n})()
    nightmare.resolve(response);
  } catch (e) {
    nightmare.reject(e);
  }
})()
`;

exports.execute = minstache.compile(execute);
exports.inject = minstache.compile(inject);
