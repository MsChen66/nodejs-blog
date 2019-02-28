var sum = require('./sum');
//断言
var assert = require('assert');
assert.strictEqual(sum(),0);
//断言 sum(1,2) ===3
assert.strictEqual(sum(1,2),3)
//断言表达式是否成立，如果不成立，就抛出错误
assert.strictEqual(sum(1,2,3),6)