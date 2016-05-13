# **patternMatchingJs**
---
*Lib to enable pattern matching with a synthax close to languages like Ocaml*

---
#### **Installation**
Unfortunately the code can't be downloaded using npm for now. You can instead get match.js from here until then and put it inside your project. It will be available in the future with npm.

---

####**How to import the lib**

 This lib is written to work with AMD loaders, node and without any loader. There is no dependency with others libs to work. So you can choose any of the folowing methods
 
Working without any loader just add :

```html
<script src="match.js" type="text/javascript"></script>
```
 
With require js : 

```javascript
define(['match.js'], function(match) {
    // code
});
```

In node : 

```javascript
var match = require('match.js')
```

---
####**Simple example**

Let's start with an example to get started. We'll see how to implement a function that calculates the factorial.

In Ocaml we can do : 

```ocaml
let rec fact n = match n with
    | 0 -> 1
    | n -> n * fact n-1
;;
```

Let's see how it looks with match.js :

```javascript
var fact = function(n) {
  return match([
    { '0' : function() { return 1; } },
    { 'n' : function(n) { return n * fact(n - 1); } }
  ])(n);
};
```