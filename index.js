const
	globalBase = {
		name: 'global',
		run: false,
		tests: {}
	},
	keywords = new Set(['name', 'run', 'inherits']);

function test(setup) {
	setup = struct(setup);
	setup = inherit(setup);
	run(setup);
	return setup;
}

function struct(rawSetup) {
	const setup = {
		tests: {}
	};

	for (let [key, value] of Object.entries(rawSetup)) {
		if (keywords.has(key) || key.startsWith('_'))
			setup[key] = value;
		else
			setup.tests[key] = value;
	}

	if (setup.inherits == null)
		setup.inherits = [globalBase];
	if (!(setup.inherits instanceof Array))
		setup.inherits = [setup.inherits];

	return setup;
}

function inherit(rawSetup) {
	const base = rawSetup.inherits;

	const inheritFrom = Object.create(base[0]);
	for (let mixin of base.slice(1)) {
		const tests = inheritIt(inheritFrom.tests, mixin.tests);
		Object.assign(inheritFrom, mixin);
		inheritFrom.tests = tests;
	}

	const setup = Object.assign(Object.create(inheritFrom), rawSetup);
	setup.tests = inheritIt(setup.tests, inheritFrom.tests);
	return setup;
}

function inheritIt(block, base) {
	const result = Object.assign({}, base, block);
	for (let key of Object.keys(block))
		if (isObject(block[key]) && key in base && isObject(base[key]))
			result[key] = inheritIt(block[key], base[key]);
	return result;
}

function run(setup) {
	if (!setup.run)
		return;

	const {name, tests} = setup;
	runIt(setup, `[${name}]`, tests);
}

function runIt(root, desc, contents) {
	if (isObject(contents))
		describe(desc, () => {
			for (let [desc, nestedContents] of Object.entries(contents))
				runIt(root, desc, nestedContents);
		});
	else if (typeof contents === 'function')
		it(desc, contents.bind(root));
}

function isObject(value) {
	return typeof value === 'object' && value !== null;
}

module.exports = test;