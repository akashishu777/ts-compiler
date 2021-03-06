﻿import sinonChai = require('./sinon-chai');
import ts = require('../tsc');
import path = require('path');
import fs = require('fs');

var expect = sinonChai.expect;


//ReSharper disable WrongExpressionStatement
describe('BatchCompiler', () => {

	var bc: ts.BatchCompiler;
	before(() => {
		bc = new ts.BatchCompiler();
	});

	it('redirects errors to event emitter', done => {
		bc.on('error', message => {
			expect(message).to.exist;
			done();
		});
		bc.compile(['test/fixtures/bad.ts'], { skipWrite: true });
	});

	it('writes result to a destination file', function(done) {
		this.timeout(5000);
		expect(fs.existsSync('test/fixtures/foo.js')).to.be.false;
		ts.compile(
			['test/fixtures/foo.ts'],
			(err: Error, results: ts.OutputFile[]) => {
			expect(err).to.be.null;
			var foo = results[0];
			expect(fs.existsSync(foo.name)).to.be.true;
			fs.unlink(foo.name, done);
		});
	});

	it('supports "skipWrite" option, not writing to a destination file', done => {
		ts.compile(
			['test/fixtures/foo.ts'],
			{ skipWrite: true },
			(err: Error, results: ts.OutputFile[]) => {
			expect(err).to.be.null;
			var foo = results[0];
			expect(fs.existsSync(foo.name)).to.be.false;
			done();
		});
	});

	it('resolves references', done => {
		ts.compile(
		['test/fixtures/baz.ts'],
		(err: Error, results: ts.OutputFile[]) => {
			expect(err).to.be.null;
			expect(results.length).to.equal(2);
			expect(path.basename(results[0].name)).to.equal('Foo.js');
			done();
		});
	});

	it('handles a batch of files', done => {
		ts.compile(
		['test/fixtures/foo.ts', 'test/fixtures/bar.ts'],
		{ skipWrite: true },
		(err: Error, results: ts.OutputFile[]) => {
			expect(err).to.be.null;
			var foo = results[0];
			expect(stripNewlines(foo.text)).to.equal('(function (foo) {});');
			var bar = results[1];
			expect(stripNewlines(bar.text)).to.equal('(function (bar) {});');
			done();
		});
	});
});

function stripNewlines(text) {
	return text.replace(/[\r\n]+/g, '');
}
