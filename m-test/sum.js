function sum(...rest){
    // console.log(rest)
    var res = 0;
    for (var v of rest) {
        res +=v;
    }
    return res;
}
// sum(1,2,3,4,5);
module.exports = sum;