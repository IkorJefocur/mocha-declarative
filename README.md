# Mocha-declarative

Split mocha tests in blocks with small reusable functions and inheritance possibilities.

The main goal is to make that the tests of modules (classes) inherited from other modules are also inherits from parents tests. It is not some kind of full oop wrapper.

## Usage

```js
const test = require('mocha-declarative');

// Test block
const abstract = test({

	// Don't run tests instantly, only use this block for inherit (default behavior)
	run: false,

	'should do something great'() {}, // "it" declaration

	// "describe" block
	'some feature': {
		// Inner "describe" block. There is no limit for depth.
		'base functionality': {
			// "it" declaration
			'should work'() {}
		},

		'should make a few things'() {},

		'should do something'() {}
	},

	// Helper method.
	// Each key starts with "_" will be putted to result object as it, without modification.
	_getInstance() {},

	'important things': {
		// "it" declaration that uses helper method
		'should correctly create instance'() {
			const instance = this._getInstance();
			// ...
		}
	}

});

const a = test({

	// Name of unit
	name: 'A',
	// Inherit from block "abstract"
	inherits: abstract,
	// Run tests instantly
	run: true,

	// Modify (not rewrite) "describe" block
	'some feature': {
		'base functionality': {
			// Additional "it" declaration
			'should be A'() {},

			// Rewrite inherited "it" declaration
			'should work'() {}
		},

		// Disable inherited "it" declaration
		'should make a few things': null
	}

});

// Mixin
const mixin = test({

	'should implement something'() {},

	_check() {}

});

const b = test({

	name: 'B',
	// Inherit from block "abstract" and mix block "mixin"
	inherits: [abstract, mixin],
	run: true

});
```