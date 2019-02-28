//测试sum模块的所有代码用例
var assert = require('assert');
var sum = require('../sum');
//编写测试用例
//测试用例集
describe('测试sum.js',function(){
    //测试sum函数的用例
    describe('测试sum函数',function(){
        it('sum() 结果应该是0',function(){
            assert.strictEqual(sum(),0)
        })
        it('sum(1) 结果应该是1',function(){
            assert.strictEqual(sum(1),1)
        })
        it('sum(1,2) 结果应该是3',function(){
            assert.strictEqual(sum(1,2),3)
        })
    })
})