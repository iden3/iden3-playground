# iden3-playground


### Generate browserify bundles
```js
// iden3js
npm run build && browserify lib/index.js --standalone iden3 > iden3js-bundle.js

// circom
browserify index.js --standalone circom > circom-bundle.js

// snarkjs
browserify index.js --standalone snarkjs > snarkjs-bundle.js
```
