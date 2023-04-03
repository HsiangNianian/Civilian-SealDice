// ==UserScript==
// @name         B站番剧监听
// @author       简律纯
// @version      1.0.0
// @description  bangumi
// 2023-03-27
// @license      by-nc-sa 4.0
// @homepageURL  https://sealdice.civilian.jyunko.cn
// ==/UserScript==

let ext = seal.ext.find('bangumi');
if (!ext) {
    ext = seal.ext.new('bangumi', '简律纯', '1.0.0');
    seal.ext.register(ext);
}
const bangumi = seal.ext.newCmdItemInfo();

bangumi.solve = (ctx, msg, cmdArgs) => {
    const http = require('http');
    const async = require('async');

    var bangumiIDs = [44860, 5678, 9012]; // 要监听的番剧ID列表

    function checkBangumiUpdate(bangumiID, callback) {
        var options = {
            hostname: 'api.bilibili.com',
            path: '/pgc/web/season/stat?season_id=' + bangumiID,
            method: 'GET'
        };

        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                var response = JSON.parse(chunk);
                if (response.result.episode_status == 13) {
                    // 番剧有更新，回调通知
                    callback(null, bangumiID);
                } else {
                    callback(null);
                }
            });
        });

        req.on('error', function (e) {
            callback(e);
        });

        req.end();
    }

    // 异步并发监听番剧更新
    async.whilst(
        function () { return true; }, // 持续监听
        function (callback) {
            async.map(bangumiIDs, checkBangumiUpdate, function (err, results) {
                if (err) {
                    console.error("监听出错：" + err);
                    seal.replyToSender(ctx, msg, `"监听出错：" + ${err}`);
                    return seal.ext.newCmdExecuteResult(true);
                } else if (results.length > 0) {
                    console.log("番剧更新了：" + results.join(', '));
                    seal.replyToSender(ctx, msg, `"番剧更新了：" + ${results.join(', ')}`);
                    return seal.ext.newCmdExecuteResult(true);
                } else {
                    console.log("监听ing...")
                }
                setTimeout(callback, 1000); // 每60秒检查一次是否有更新
            });
        },
        function (err) {
            console.error("监听出错：" + err);
            seal.replyToSender(ctx, msg, `"监听出错：" + ${err}`);
            return seal.ext.newCmdExecuteResult(true);
        }
    );
}

ext.cmdMap['bangumi'] = bangumi;