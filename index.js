const
	globalBase = {
		name: 'global',
		run: false,
		only: false,
		tests: {}
	},
	keywords = new Set(['name', 'run', 'inherits', 'only']);

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
			setup.tests[key] = structIt(value);
	}

	if (setup.inherits == null)
		setup.inherits = [globalBase];
	if (!(setup.inherits instanceof Array))
		setup.inherits = [setup.inherits];

	if (
		setup.only && setup.run
		&& !Object.prototype.hasOwnProperty.call(setup, 'only')
	)
		setup.only = false;

	return setup;
}

function structIt(block) {
	if (isObject(block))
		for (let [desc, contents] of Object.entries(block))
			block[desc] = structIt(contents);

	else if (!(block instanceof Array))
		return [block];

	return block;
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
		if (isObject(block[key]) && isObject(base[key]))
			result[key] = inheritIt(block[key], base[key]);

		else if (block[key] instanceof Array) {
			result[key] = [];
			for (let [index, pipelinePart] of block[key].entries())
				if (typeof pipelinePart === 'function')
					result[key].push(pipelinePart);
				else if (pipelinePart)
					result[key].push(base[key][index]);
		}

	return result;
}

function run(setup) {
	const {name, tests, run, only} = setup;
	if (!run)
		return;

	const rootDescribe = only ? describe.only : describe;
	rootDescribe(`[${name}]`, () => {
		for (let [desc, contents] of Object.entries(tests))
			runIt(setup, desc, contents);
	});
}

function runIt(root, desc, contents) {
	if (isObject(contents))
		describe(desc, () => {
			for (let [desc, nestedContents] of Object.entries(contents))
				runIt(root, desc, nestedContents);
		});

	else if (contents instanceof Array && contents.length > 0)
		it(desc, async () => {
			let arg = await runPipelineFn(
				contents[0].bind(root),
				contents[0].length >= 1
			);
			for (let fn of contents.slice(1))
				arg = await runPipelineFn(
					done => fn.call(root, arg, done),
					fn.length >= 2
				);
		});
}

async function runPipelineFn(fn, callbackMode = false) {
	if (callbackMode) {
		let done;
		const asyncResult = new Promise((resolve, reject) => {
			done = (error, value) => error === undefined
				? resolve(value)
				: reject(error);
		});
		fn(done);
		return asyncResult;
	} else
		return fn();
}

function isObject(value) {
	return typeof value === 'object'
		&& value !== null
		&& !(value instanceof Array);
}

module.exports = test;