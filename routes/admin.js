var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017'
var dbname = 'czblog';



function formatTime(date) {
    var y = date.getFullYear();
    var m = date.getMonth();
    var d = date.getDate();
    var h = date.getHours();
    var mi = date.getMinutes();

    return y + '-' + m + '-' + d + ' ' + h + ':' + mi;

}
//用户管理首页
router.get('/', function (req, res) {
    //渲染管理员页面模版
    MongoClient.connect(url, (error, dbC) => {
        var db = dbC.db(dbname);
        var userid = new ObjectID(req.session.userid);
        db.collection('user').findOne({ _id: userid }, function (err, user) {
            res.render('admin', {
                title: '用户管理首页',
                username: req.session.username,
                user: user
            })
        })
    })
})
//退出
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        console.log('session 清除成功');
        //重定向
        res.redirect('/')
    })
})
//一页显示多少条数据
var pageSize = 15;
//用户账号管理
router.get('/users', function (req, res) {
    //渲染账号管理页面模版
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var db = db.db(dbname);
        db.collection("user").find({}, {
            limit: pageSize
        }).sort({ time: -1 }).toArray().then((result) => {
            db.collection('user').count(function (err, count) {
                var pages = Math.ceil(count / pageSize);
                console.log('查询成功' + result.length);//结果为数组
                res.render('a-users', {
                    username: req.session.username,
                    result: result,
                    pageNum: 1,
                    preUrl: '/admin/page/',
                    nextUrl: '/admin/page/2',
                    pages
                })
            })

        }).catch((err) => {
            console.log(err);
        });
    });
})
//分页
router.get('/page/:num', (req, res) => {
    console.log(req.params.num);
    //要显示的页面
    var num = parseInt(req.params.num);
    MongoClient.connect(url, (error, dbC) => {
        var db = dbC.db(dbname);
        db.collection('user').find({}, {
            skip: (num - 1) * pageSize,
            limit: pageSize
        }).toArray((err, result) => {
            console.log(result.length)
            db.collection('user').count(function (err, count) {
                var pages = Math.ceil(count / pageSize)
                res.render('a-users', {
                    title: '首页',
                    username: req.session.username,
                    result: result,
                    pageNum: num,
                    preUrl: '/admin/page/' + (num - 1),
                    nextUrl: '/admin/page/' + (num + 1),
                    pages
                })
            })
        })
    })
})
//修改页面
router.get('/update/:uid', function (req, res) {
    //获取文章的id
    console.log(req.params.uid);
    //根据文章的id去数据查询文章的详情
    //注意要查询id是个对象还是字符串
    var uid = new ObjectID(req.params.uid)
    MongoClient.connect(url, (err, dbC) => {
        var db = dbC.db(dbname);
        db.collection('user').findOne({ _id: uid }, function (err, data) {
            console.log(data);
            res.render('a-update', {
                title: "修改信息",
                username: req.session.username,
                data: data
            })
        })
    })
    // res.render('update',{
    //     username: req.session.username,
    //     title:'修改信息'
    // })
})
//修改用户页面接口
var crypto = require('crypto');
router.post('/api-update', (req, res) => {
    try {
        //获取到更新页面提交的数据
        console.log(req.body);
        var username = req.body.uname;
        //使用md5 对密码进行加密
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.psd).digest('hex');
        console.log(password);
        var time = req.body.time;
        var id = req.body.id;
        // var user = {
        //     id,
        //     username,
        //     password,
        //     time
        // }
        // console.log(user,666);
        //将修改的数据更新到数据库里面
        var id = new ObjectID(id);
        MongoClient.connect(url, function (error, dbC) {
            var db = dbC.db(dbname);
            db.collection('user').updateOne({ "_id": id }, {
                $set: {
                    "username": username,
                    "password": password,
                    "time": time
                }
            }, function (err, data) {
                // console.log(data);
                res.json({
                    code: 1,
                    msg: '修改成功'
                })
            })
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: 500,
            msg: error
        })
    }
})
//删除用户页面
router.get('/users/:uid', (req, res) => {
    //获取用户的id
    console.log(req.params.uid);
    //根据文章的id去数据库中查询用户
    //注意要查询id是个对象还是字符串
    var uid = new ObjectID(req.params.uid)
    MongoClient.connect(url, (err, dbC) => {
        var db = dbC.db(dbname);
        db.collection('user').remove({ _id: uid }, function (err, data) {
            res.redirect('back');
        })
    })
})
//增加用户页面
router.get('/insert', (req, res) => {
    res.render('a-insert', {
        title: '增加界面'
    })
})
//增加用户页面接口
router.post('/api-insert', (req, res) => {
    try {

        //获取到 注册页面提交的数据  req。body   { username: '12', password: '12' }
        console.log(req.body);
        var username = req.body.uname;

        //使用md5对密码进行加密
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.psd).digest('hex');
        console.log(password);

        //保存注册时间
        var time = new Date();
        var user = {
            username,
            password,
            time
        }

        //存到数据库里面
        MongoClient.connect(url, function (error, dbC) {
            var db = dbC.db(dbname);
            //先做查询  有没有这个用户
            db.collection('user').find({
                username
            }).toArray(function (error, findData) {
                console.log(findData);
                if (findData.length) {
                    //用户名存在
                    res.json({
                        code: 0,
                        msg: "用户名已经存在"
                    })
                } else {
                    db.collection('user').insertOne(user, (err, data) => {
                        console.log(data);
                        // 返回json数据
                        res.json({
                            code: 1,
                            msg: "添加成功"
                        })

                    })
                }
            })
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: 500,
            msg: error
        })
    }
})
//用户文章管理
var pageSize = 20;
router.get('/article', (req, res) => {
    // res.render('a-article',{
    //     title:'文章管理',
    //     username: req.session.username
    // })
    //从数据库中提取文章信息，渲染到网页
    MongoClient.connect(url, (error, dbC) => {
        var db = dbC.db(dbname);
        db.collection('article').find({}, {
            limit: 20
        }).sort({ time: -1 }).toArray().then((data) => {
            console.log(data);
            //怎么才能知道总共有多少页
            db.collection('article').count(function (err, count) {
                count //总共多少条数据
                //得到页数
                var pages = Math.ceil(count / pageSize)
                res.render('a-article', {
                    title: '首页',
                    username: req.session.username,
                    data: data,
                    formatTime: formatTime,
                    name: '匿名',
                    pageNum: 1,
                    preUrl: '/page/',
                    nextUrl: '/page/2',
                    pages
                })

            })
        }).catch(function (error) {
            console.log(error);
        })
    })
})
//用户文章删除
router.get('/article/:aid', (req, res) => {
    console.log(req.params.aid);
    var aid = new ObjectID(req.params.aid);
    MongoClient.connect(url, (err, dbC) => {
        var db = dbC.db(dbname);
        db.collection('article').remove({ _id: aid }, function (err, data) {
            res.redirect('back');
        })
    })
})
//用户文章修改
router.get('/art-update/:aid', function (req, res) {
    //获取文章的id
    console.log(req.params.aid);
    //根据文章的id去数据查询文章的详情
    //注意要查询id是个对象还是字符串
    var aid = new ObjectID(req.params.aid)
    MongoClient.connect(url, (err, dbC) => {
        var db = dbC.db(dbname);
        db.collection('article').findOne({ _id: aid }, function (err, data) {
            console.log(data);
            res.render('art-update', {
                title: "修改文章信息",
                // username: req.session.username,
                data: data
            })
        })
    })
    // res.render('update',{
    //     username: req.session.username,
    //     title:'修改信息'
    // })
})
//用户文章修改接口
router.post('/api-art-update', (req, res) => {
    try {
        //获取到更新页面提交的数据
        console.log(req.body, 222);
        var title = req.body.title;
        var content = req.body.content;
        var count = req.body.count;
        var time = req.body.time;
        var id = req.body.id;
        //将修改的数据更新到数据库里面
        var id = new ObjectID(id);
        MongoClient.connect(url, function (error, dbC) {
            var db = dbC.db(dbname);
            db.collection('article').updateOne({ "_id": id }, {
                $set: {
                    "title": title,
                    "content": content,
                    "pv": parseInt(count),
                    "time": new Date(time),
                }
            }, function (err, data) {
                // console.log(data);
                res.json({
                    code: 1,
                    msg: '修改成功',
                    formatTime: formatTime
                })
            })
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: 500,
            msg: error
        })
    }
})
//管理员文章发表
router.get('/art-publish', (req, res) => {
    res.render('art-publish', {
        title: '发布文章',
        username: req.session.username
    })
})
//管理员文章发表接口
router.post('/api-art-publish', (req, res) => {
    console.log(req.body);
    var article = {
        title: req.body.title,
        content: req.body.content,
        time: new Date(),
        username: req.session.username,
        userid: req.session.userid
    }
    console.log(article);

    MongoClient.connect(url, function (err, dbC) {
        var db = dbC.db(dbname);
        db.collection('article').insertOne(article, (error, data) => {
            if (error) throw error;
            res.redirect('/admin/article')
        })
    })

})
//管理员文章查询
router.post('/art-select', (req, res) => {
    var seleName = req.body.seleName;
    console.log(seleName)
    MongoClient.connect(url, (error, dbC) => {
        var db = dbC.db(dbname);
        db.collection('article').find({ "username": seleName }).toArray(function (error, data) {
            if (data.length) {
                res.json({
                    data1: data
                })
            } else {
                res.json({
                    msg: '用户名不存在'
                })
            }
        })
    })
})
//轮播图管理
router.get('/slide', (req, res) => {
    MongoClient.connect(url, (error, dbC) => {
        var db = dbC.db(dbname);
        db.collection('article').find({}, {
            limit: 20
        }).sort({ time: -1 }).toArray().then((data) => {
            console.log(data);
            //怎么才能知道总共有多少页
            db.collection('article').count(function (err, count) {
                count //总共多少条数据
                //得到页数
                var pages = Math.ceil(count / pageSize)
                res.render('slide', {
                    title: '轮播图页',
                    username: req.session.username,
                    data: data,
                    formatTime: formatTime,
                    name: '匿名',
                    pageNum: 1,
                    preUrl: '/page/',
                    nextUrl: '/page/2',
                    pages
                })

            })
        }).catch(function (error) {
            console.log(error);
        })
    })
})
//轮播图的添加
router.get('/ins-slide/:aid', (req, res) => {
    var aid = new ObjectID(req.params.aid)
    MongoClient.connect(url, (err, dbC) => {
        var db = dbC.db(dbname);
        db.collection('article').findOne({ _id: aid }, function (err, data) {
            console.log(data, 2222);
            data.time = new Date(data.time);
            if (data.pv == undefined) {
                data.pv = 0;
            } else {
                data.pv = parseInt(data.pv);
            }
            var data1 = {
                title: data.title,
                content: data.content,
                username: data.username,
                userid: data.userid,
                pv: data.pv,
                time: data.time
            }
            db.collection('slide').insertOne(data1, function (err, res1) {
                console.log('插入成功')
            })
            
        })
        db.collection('slide').find({}).toArray(function (err, result) {
            if (err) throw err;
            res.render('slide-info', {
                result:result,
                username: req.session.username,
                formatTime:formatTime
            })
        })
    })
})
//轮播图的删除
router.get('/del-slide/:aid',(req,res) => {
    console.log(req.params.aid);
    var aid = new ObjectID(req.params.aid);
    MongoClient.connect(url, (err, dbC) => {
        var db = dbC.db(dbname);
        db.collection('slide').remove({ _id: aid }, function (err, data) {
            res.redirect('back');
        })
    })
})






module.exports = router;