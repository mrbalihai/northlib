const test = require('tape');
const F = require('../lib/function');

test('curry1 test', (assert) => {
    assert.plan(1);
    const adder = F.curry((a, b) => a + b);
    const add1 = adder(1);
    assert.equal(add1(1), 2);
});

test('curry4 test', (assert) => {
    assert.plan(1);
    const adder = F.curry((a, b, c, d, e) => a + b + c + d + e);
    const add1 = adder(1);
    const add3 = add1(2);
    const add4 = add3(1);
    const add5 = add4(1);
    assert.equal(add5(1), 6);
});
