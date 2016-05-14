# **patternMatchingJs**
---
*Lib to enable pattern matching with a synthax close to languages like Ocaml*

---
#### **Installation**
Unfortunately, the code can't be downloaded using npm for now. You can instead get match.js from here until then and put it inside your project.

---

####**How to import the lib**

 This lib is written to work with AMD loaders, node and without any loader. There is no dependency with others libs to work. So you can choose any of the folowing methods (for example).
 
Working without any loader just add in your html file :

```html
<script src="./match.js" type="text/javascript"></script>
```
 
With require js : 

```javascript
define(['./match'], function(match) {
    // code
});
```

In node : 

```javascript
var match = require('./match.js')
```

---
####**Simple example**

Let's start with an example to get started. We'll see how to implement a function that calculates the factorial a number.

In Ocaml we can do : 

```ocaml
let rec fact n = match n with
    | 0 -> 1
    | n -> n * fact n-1
;;
```

Let's see how it looks like with match.js :

```javascript
var fact = function(n) {
  return match([
    { '0' : function() { return 1; } },
    { 'n' : function(n) { return n * fact(n - 1); } }
  ])(n);
};
```
Pretty close right ?

---
####**How does it works ?**

The lib exposes one single function named "_match_" that takes a list of objects as parameter. Each object needs to have a String pattern as key and a function to execute if a match is made as callback. Then a function expecting a data to do the matching as parameter is returned.

---
####**Matching a value**

We can do as follow to match a value

```javascript
var matcher = match([
    // Matching an integer
    { '42' : function() { console.log('Number 42 matched') } },
    // Matching a float
    { '11.1' : function() { console.log('Float 11.1 matched') } },
    // Matching a String (1) : Double quote
    { '"foo"' : function() { console.log('String "foo" matched') } },
    // Matching a String (2) : Single quote
    { "'bar'" : function() { console.log('String "bar" matched') } }
    // Matching an empty array
    { '[]' : function() { console.log('Empty array matched') } },
    // Matching an array with any values (after the empty array)
    { '_::_' : function() { console.log('Array matched') } },
    // Matching empty object (after arrays since Array is object in js)
    { '{}' : function() { console.log('Empty object') } },
    // Wildcard will match any values
    { '_' : function() { console.log('Any other value matched') } }
]);

// Then we can use this matcher to test

matcher("foo") // => String "foo" matched
matcher("bar") // => String "bar" matched
matcher(11.1) // => Float 11.1 matched
matcher(42) // => Number 42 matched
matcher([]) // => Empty array matched
matcher([1,2,3,4,5]) // => Array matched
matcher({}) // => Empty object
```
---
####**Matching and variables extraction**

One of the use of pattern matching in general is to extract data inside the value beeing matched. Note that the variables will be passed to your callback function in the order they appear inside the pattern. So we can do something like this :

```javascript
var matcher = match([
    // Matching an array of length 3 and extraction of le last member
    // Note that  : it expects the first element to be 12
    //              _ will match but will not be passed to the function
    { '[12,_,a]' : function(a) { console.log('a : '+ a) } },
    // Extract the first and second element + the rest
    // (can be a::l to just get the first and the rest)
    { 'a::b::l' : function(a, b, l) {
            console.log('a : ' + a + ' and b : ' + b);
            console.log('Rest of array : ' + l.toString());
        }
    },
    // Extract members by their keys inside an object
    // Note that the object must contains only the listed keys
    { '{a}' : function(a) { console.log('a : '+a) } }
]);

// Then we can use this matcher to test

matcher([12,24,48]); // => a : 48
matcher([1,2,3,4,5]); // => a : 1 and b : 2
                      //    Rest of array : 3,4,5
matcher({a:42}); // => a : 42
```
---
*You can nest arrays with values and objects inside array. But you can't nest anything inside objects since it only works for extractions in this case*

---
####**Errors**

 - Note that if no pattern is matched you will get an error saying that you should add a "_" pattern.
 - You can't put spaces in the pattern declaration for now and will get an error saying "invalid pattern" if you try (This limitation will be removed in the future)
