/**
 The MIT License (MIT)
 Copyright (c) 2016 Dias Alain
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
/* jshint undef: true, unused: true*/
/* globals define */
/* globals module */
(function (root, match) {
  if (typeof define === 'function' && define.amd) {
    define(['match'], match);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = match();
  } else {
    root.match = match();
  }
})(this, function () {
  'use strict';

  /**
   * Pollyfill map function for IE 8 support
   */
  (function (fn) {
    if (!fn.map) fn.map = function (f) {
      var r = [];
      for (var i = 0; i < this.length; i++)if (this[i] !== undefined)r[i] = f(this[i], i);
      return r;
    }
  })(Array.prototype);

  var NUMBER = /^-?[0-9]+(\.[0-9]+)?/;
  var STRING = /^(('[a-zA-Z0-9]*')|("[a-zA-Z0-9]*"))/;
  var IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9]*/;
  var LITTERAL = [
    {
      name: 'LBRACKET',
      value: '['
    },
    {
      name: 'RBRACKET',
      value: ']'
    },
    {
      name: 'SPACE',
      value: ' '
    },
    {
      name: 'COMMA',
      value: ','
    },
    {
      name: 'LBRACES',
      value: '{'
    },
    {
      name: 'RBRACES',
      value: '}'
    },
    {
      name: 'COLON',
      value: ':'
    },
    {
      name: 'WILDCARD',
      value: '_'
    }
  ];

  /**
   * Rules
   */
  var applyArrayRule;
  var applyObjectRule;
  var applyExprRule;
  var applyCommaSeparatedExprRule;
  var applyVariableRule;
  var applyCommaSeparatedVariableRule;
  var applyValueRule;

  /*** Utility functions ***/

  var findFirst = function (array, predicateFunction) {
    var i = 0;
    var l = array.length;
    while (i < l) {
      if (predicateFunction(array[i], i)) {
        return array[i];
      }
      i++;
    }
  };

  var findFirstIndex = function (array, predicateFunction) {
    var i = 0;
    var l = array.length;
    while (i < l) {
      if (predicateFunction(array[i], i)) {
        return i;
      }
      i++;
    }
    return -1;
  };

  var findLastIndex = function (array, predicateFunction) {
    var i = array.length - 1;
    while (i >= 0) {
      if (predicateFunction(array[i], i)) {
        return i;
      }
      i--;
    }
    return -1;
  };

  /*** Parsing functions ***/

  var tokenizeNumber = function (chunk) {
    var part = NUMBER.exec(chunk);
    if (part) {
      var string = part[0];
      return {
        name: 'NUMBER',
        value: string,
        length: string.length
      };
    }
  };

  var tokenizeString = function (chunk) {
    var part = STRING.exec(chunk);
    if (part) {
      var string = part[0].slice(1, -1);
      return {
        name: 'STRING',
        value: string,
        length: string.length + 2
      };
    }
  };

  var tokenizeIdentifier = function (chunk) {
    var part = IDENTIFIER.exec(chunk);
    if (part) {
      var string = part[0];
      return {
        name: 'IDENTIFIER',
        value: string,
        length: string.length
      };
    }
  };

  var tokenizeLitteral = function (chunk) {
    var charToTest = chunk[0];
    var first = findFirst(LITTERAL, function (current) {
      return current.value === charToTest;
    });

    if (first) {
      first.length = 1;
    }

    return first;
  };

  var tokenize = function (stringToParse) {
    var tokens = [];
    var chunk;
    var pos = 0;
    var parsedToken;
    while ((chunk = stringToParse.slice(pos))) {
      parsedToken = tokenizeNumber(chunk) || tokenizeString(chunk) || tokenizeIdentifier(chunk) || tokenizeLitteral(chunk);
      if (!parsedToken) {
        return; // Can't handle the given string to parse
      }
      tokens.push(parsedToken);
      pos += parsedToken.length;
    }
    return tokens;
  };

  /*** Rule functions ***/

  /**
   * Checks if the expression follows :
   *
   * Array : | LBRACKET * RBRACKET
   | LBRACKET * CommaSeparactedExprs * RBRACKET
   | LBRACKET * expr * RBRACKET
   | expr * COLON * COLON * expr

   * to ensure the pattern corresponds to an array in the pattern
   *
   * @param tokens the parsed tokens
   * @returns {*}
   */
  applyArrayRule = function (tokens) {
    // tokens must be longer than 2
    if (tokens && tokens.length > 1) {
      var firstColonIndex = findFirstIndex(tokens, function (current, index) {
        var isColon = current.name === 'COLON';
        if (isColon) {
          var splitedTokens = tokens.slice(0, index);

          var openingBracketOrBracesIndex = findLastIndex(splitedTokens, function (current) {
            return current.name === 'LBRACKET' || current.name === 'LBRACES';
          });

          var closingBracketOrBracesIndex = findLastIndex(splitedTokens, function (current) {
            return current.name === 'RBRACKET' || current.name === 'RBRACES';
          });

          isColon = isColon && ((openingBracketOrBracesIndex === -1 && closingBracketOrBracesIndex === -1 ) || (openingBracketOrBracesIndex < index && closingBracketOrBracesIndex === index - 1));
        }
        return isColon;
      });
      if (firstColonIndex != -1 && tokens[firstColonIndex + 1].name === 'COLON') {
        var headExpression = applyExprRule.apply(null, [ tokens.slice(0,
          firstColonIndex) ]);
        if (headExpression) {
          var queueExpression = applyExprRule.apply(null, [ tokens
            .slice(headExpression.length + 2) ]);
          if (queueExpression) {
            return {
              name: 'ARRAY',
              expressions: [ headExpression, queueExpression ],
              length: headExpression.length + 2 + queueExpression.length
            };
          }
        }
      } else if (tokens[0].name === 'LBRACKET') {
        var lastIndex = findLastIndex(tokens, function (current) {
          return current.name === 'RBRACKET';
        });

        if (lastIndex === 1) {
          return {
            name: 'ARRAY',
            expressions: [],
            length: 2
          };
        }

        var slicedTokens = tokens.slice(1, lastIndex);
        var expression = applyCommaSeparatedExprRule.apply(null, [ slicedTokens ]) || applyExprRule.apply(null, [ slicedTokens ]);
        if (expression) {
          return {
            name: 'ARRAY',
            expressions: [ expression ],
            length: lastIndex + 1
          };
        }
      }
    }
  };

  /**
   * Checks if the expression follows :
   *
   * expr :  | Array
   | Object
   | Variable
   | Value

   * to ensure the pattern corresponds to an expression declaration in the pattern
   *
   * @param tokens the parsed tokens
   * @returns {*}
   */
  applyExprRule = function (tokens) {
    if (tokens && tokens.length > 0) {
      var expression = applyArrayRule.apply(null, [ tokens ]) || applyObjectRule.apply(null, [ tokens ]) || applyValueRule.apply(null, [ tokens ]) || applyVariableRule.apply(null, [ tokens ]);
      if (expression) {
        return {
          name: 'EXPR',
          expressions: [ expression ],
          length: expression.length
        };
      }
    }
  };

  /**
   * Checks if the expression follows :
   *
   * Object : | LBRACES * RBRACES
   | LBRACES * Variable * RBRACES
   | LBRACES * CommaSeparatedVariable * RBRACES

   * to ensure the pattern corresponds to an object declaration in the pattern
   *
   * @param tokens the parsed tokens
   * @returns {*}
   */
  applyObjectRule = function (tokens) {
    if (tokens && tokens.length > 1 && tokens[0].name === 'LBRACES') {
      var lastIndex = findLastIndex(tokens, function (current) {
        return current.name === 'RBRACES';
      });

      var slicedTokens = tokens.slice(1, lastIndex);
      var expression = applyCommaSeparatedVariableRule.apply(null, [ slicedTokens ]) || applyVariableRule.apply(null, [ slicedTokens ]);
      return {
        name: 'OBJECT',
        expressions: [ expression ],
        length: lastIndex + 1
      };
    }
  };

  /**
   * Checks if the expression follows :
   *
   * CommaSeparatedExpr : | expr * COMMA * expr
   | expr * COMMA * CommaSeparatedExpr

   * to ensure the pattern corresponds to a declaration of expressions separated by a comma in the pattern
   *
   * @param tokens the parsed tokens
   * @returns {*}
   */
  applyCommaSeparatedExprRule = function (tokens) {
    if (tokens && tokens.length > 2) {
      var firstCommaIndex = findFirstIndex(tokens, function (current, index) {
        var isComma = current.name === 'COMMA';
        if (isComma) {
          var splitedTokens = tokens.slice(0, index);

          var openingBracketOrBracesIndex = findLastIndex(splitedTokens, function (current) {
            return current.name === 'LBRACKET' || current.name === 'LBRACES';
          });

          var closingBracketOrBracesIndex = findLastIndex(splitedTokens, function (current) {
            return current.name === 'RBRACKET' || current.name === 'RBRACES';
          });

          isComma = isComma && ((openingBracketOrBracesIndex === -1 && closingBracketOrBracesIndex === -1 ) || (openingBracketOrBracesIndex < index && closingBracketOrBracesIndex === index - 1));
        }
        return isComma;
      });

      if (firstCommaIndex != -1) {
        var slicedLeft = tokens.slice(0, firstCommaIndex);
        var leftExpression = applyCommaSeparatedExprRule.apply(null, [ slicedLeft ]) || applyExprRule.apply(null, [ slicedLeft ]);
        if (leftExpression) {
          var slicedRight = tokens.slice(firstCommaIndex + 1);
          var rightExpression = applyCommaSeparatedExprRule.apply(null, [ slicedRight ]) || applyExprRule.apply(null, [ slicedRight ]);
          if (rightExpression) {
            return {
              name: 'COMMASEPARATEDEXPR',
              expressions: [ leftExpression, rightExpression ],
              length: leftExpression.length + 1 + rightExpression.length
            };
          }
        }
      }
    }
  };

  /**
   * Checks if the expression follows :
   *
   * Value : | String
   | Number
   | Wildcard

   * to ensure the pattern corresponds to a value declaration in the pattern
   *
   * @param tokens the parsed tokens
   * @returns {*}
   */
  applyValueRule = function (tokens) {
    if (tokens && tokens.length === 1 && (tokens[0].name === 'STRING' || tokens[0].name === 'NUMBER' || tokens[0].name === 'WILDCARD')) {
      return {
        name: 'VALUE',
        expressions: tokens[0].value,
        length: 1
      };
    }
  };

  /**
   * Checks if the expression follows :
   *
   * Variable : Identifier
   * to ensure the pattern corresponds to a variable declaration in the pattern
   *
   * @param tokens the parsed tokens
   * @returns {*}
   */
  applyVariableRule = function (tokens) {
    if (tokens && tokens.length === 1 && tokens[0].name === 'IDENTIFIER') {
      return {
        name: 'VARIABLE',
        expressions: tokens[0].value,
        length: 1
      };
    }
  };

  /**
   * Checks if the expression follows :
   *
   * CommaSeparatedVariables : | Variable * COMMA * Variable
   | Variables * COMMA * CommaSeparatedVariable

   * to ensure the pattern corresponds to a declaration of variables separated by a comma in the pattern
   *
   * @param tokens the parsed tokens
   * @returns {*}
   */
  applyCommaSeparatedVariableRule = function (tokens) {
    if (tokens && tokens.length > 2) {
      var firstCommaIndex = findFirstIndex(tokens, function (current) {
        return current.name === 'COMMA';
      });

      if (firstCommaIndex != -1) {
        var slicedLeft = tokens.slice(0, firstCommaIndex);
        var leftExpression = applyVariableRule.apply(null, [ slicedLeft ]);
        if (leftExpression) {
          var slicedRight = tokens.slice(firstCommaIndex + 1);
          var rightExpression = applyCommaSeparatedVariableRule.apply(null, [ slicedRight ]) || applyVariableRule.apply(null, [ slicedRight ]);
          if (rightExpression) {
            return {
              name: 'COMMASEPARATEDVARIABLE',
              expressions: [ leftExpression, rightExpression ],
              length: leftExpression.length + 1 + rightExpression.length
            };
          }
        }
      }
    }
  };

  /**
   * Will transform the tokens to a structure that can be computed to match if a data corresponds to the pattern
   *
   * @param tokens
   * @returns {*} Object if the tokens have been computed successfully and undefine if not
   */
  var applyRules = function (tokens) {

    var parsedRule = applyExprRule.apply(null, [ tokens ]);
    if (!parsedRule) {
      return;
    } else if (tokens.length > parsedRule.length) {
      return;
    }

    return parsedRule;
  };

  /*** Pattern matching functions ***/

  var when = function (pattern) {
    var parsedRule = applyRules(tokenize(pattern));
    if (!parsedRule) {
      throw 'Invalid pattern : ' + pattern;
    }

    var compute = function (rule, value) {

      var aux = function (rule, data) {
        var env = {env: []};
        if (rule && rule.name && rule.expressions && rule.length && data && typeof data.value !== 'undefined' && data.env && data.index !== 'undefined') {
          switch (rule.name) {
            case 'EXPR':
              env.valueToCompute = data.value;
              if (data.parent !== null) {
                env.valueToCompute = env.valueToCompute[0];
              }
              env.expression = aux(rule.expressions[0], {value: env.valueToCompute, env: [], parent: data.parent});
              return {computed: env.expression.computed, env: data.env.concat(env.expression.env), length: env.expression.length};
            case 'COMMASEPARATEDEXPR':
              env.leftExpression = aux(rule.expressions[0], {value: data.value.slice(0, 1), env: [], parent: data.parent});
              env.computed = env.leftExpression.computed;
              env.length = env.leftExpression.length;
              if (env.computed) {
                env.rightExpression = aux(rule.expressions[1], {value: data.value.slice(1), env: [], parent: data.parent});
                env.computed = env.rightExpression.computed;
                env.env = env.leftExpression.env.concat(env.rightExpression.env);
                env.length += env.rightExpression.length;
              }
              return {computed: env.computed, env: env.env, length: env.length};
            case 'VARIABLE':
              if (data.parent === 'OBJECT') {
                env.variable = data.value[rule.expressions];
              } else {
                env.variable = data.value;
              }
              env.env = data.env;
              env.env.push(env.variable);
              return {computed: typeof env.variable !== 'undefined', env: env.env, length: 1};
            case 'COMMASEPARATEDVARIABLE':
              env.leftExpression = aux(rule.expressions[0], {value: data.value, env: [], index: 0, parent: data.parent});
              env.computed = env.leftExpression.computed;
              env.length = env.leftExpression.length;
              if (env.computed) {
                env.rightExpression = aux(rule.expressions[1], {value: data.value, env: [], index: 0, parent: data.parent});
                env.computed = env.rightExpression.computed;
                env.env = env.leftExpression.env.concat(env.rightExpression.env);
                env.length += env.rightExpression.length;
              }
              return {computed: env.computed, env: env.env, length: env.length};
            case 'OBJECT':
              env.computed = data.value && typeof data.value === 'object';
              if (env.computed) {
                env.nbPropsData = 0;
                for (var k in data.value) if (data.value.hasOwnProperty(k)) ++env.nbPropsData;
                if (rule.expressions[0]) {
                  env.expression = aux(rule.expressions[0], {value: data.value, env: [], index: 0, parent: rule.name});
                  env.computed = env.expression.computed && env.expression.length === env.nbPropsData;
                  env.env = env.expression.env;
                } else {
                  // is the given object an empty object ?
                  env.computed = env.nbPropsData === 0;
                }
              }
              return {computed: env.computed, env: env.env, length: 1};
            case 'ARRAY':
              env.computed = data.value && typeof data.value === 'object' && data.value.constructor === Array;
              if (env.computed) {
                if (rule.expressions.length === 0) { //Empty array
                  env.computed = data.value.length === 0;
                } else if (rule.expressions.length === 1) {
                  env.expression = aux(rule.expressions[0], {value: data.value, env: [], index: 0, parent: rule.name});
                  env.env = env.expression.env;
                  env.computed = env.expression.computed && data.value.length === env.expression.length;
                } else {
                  env.leftExpression = aux(rule.expressions[0], {value: [data.value[0]], env: [], index: 0, parent: rule.name});
                  env.computed = env.leftExpression.computed;
                  env.env = [];
                  if (env.computed) {
                    env.rightExpression = aux(rule.expressions[1], {value: [data.value.slice(1)], env: [], index: 0, parent: rule.name});
                    env.computed = env.rightExpression.computed;
                    env.env = env.leftExpression.env.concat(env.rightExpression.env);
                  }
                }
              }
              return {computed: env.computed, env: env.env, length: 1};
            case 'VALUE':
              env.value = data.value;
              env.computed = rule.expressions === '_';
              if (!env.computed) {
                env.computed = rule.expressions === env.value;
                if (!env.computed) {
                  env.integer = Number(rule.expressions);
                  if (!isNaN(env.integer)) {
                    env.computed = env.integer === env.value;
                  }
                }
              }
              return {computed: env.computed, env: env.env, length: 1};
            default:
              break;
          }
        }

        return {computed: false, env: env};
      };

      return aux(parsedRule, {
        value: value,
        env: [],
        index: 0, //used if array
        parent: null
      });
    };

    return function (value) {
      return compute(parsedRule, value);
    };
  };

  var match = function (listPatterns) {

    var matchingTable = [];

    var extractPattern = function (patternObject) {
      for (var k in patternObject) if (patternObject.hasOwnProperty(k)) return k;
    };

    listPatterns.map(function (current, index) {
      // Recupération du pattern dans l'objet courant
      var patternText = extractPattern(current);

      // Est-ce qu'un autre pattern identique existe dans les declarations ?
      var isDuplicate = findFirstIndex(listPatterns.slice(index + 1), function (current) {
        return extractPattern(current) === patternText;
      }) !== -1;

      if (isDuplicate) {
        throw 'Duplicate pattern declaration : ' + patternText;
      }

      matchingTable.push(when(patternText));
      matchingTable.push(current[patternText]);
    });

    return function (data) {
      var matched = false;
      var currentExecution;
      for (var i = 0; i < matchingTable.length && !matched; i += 2) {
        currentExecution = matchingTable[i](data);
        if (currentExecution.computed) {
          matched = true;
          return matchingTable[i + 1].apply(null, currentExecution.env);
        }
      }

      if (!matched) {
        throw 'Pattern matching incomplete ! Try to add a "_" pattern';
      }
    };
  };

  return match;

});