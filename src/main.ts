import * as https from 'https'
import * as querystring from 'querystring'
import md5 = require('md5');
import { appId, appSecret } from './private';
import { type } from 'os';
type ErrorMap = {
    [key: string]: string
}
const errorMap: ErrorMap = {
    52003: '未授权用户',
    54000: '必填参数为空',
    54001: '签名错误',
    54003: '访问频率受限'
}

export const translate = (word: string) => {

    const salt = Math.random()
    const sign = md5(appId + word + salt + appSecret)

    let from, to
    if (/[a-zA-Z]/.test(word[0])) {
        from = 'en'
        to = 'zh'
    } else {
        from = 'zh'
        to = 'en'
    }
    const query: string = querystring.stringify({
        q: word,
        from,
        to,
        appid: appId,
        salt,
        sign,
    })

    const options = {
        hostname: 'api.fanyi.baidu.com',
        port: 443,
        path: '/api/trans/vip/translate?' + query,
        method: 'GET'
    };

    const request = https.request(options, (response) => {
        let chunks: Buffer[] = []
        response.on('data', (chunk: Buffer) => {
            chunks.push(chunk)
        });
        response.on('end', () => {
            const string = Buffer.concat(chunks).toString()
            type BaiduResult = {
                from: string
                to: string
                error_code?: string
                error_msg?: string
                trans_result: {
                    src: string
                    dst: string
                }[]
            }
            const object: BaiduResult = JSON.parse(string)
            if (object.error_code) {
                console.error(errorMap[object.error_code] || object.error_msg);
                process.exit(2)

            } else {
                console.log(object.trans_result[0].dst);
                process.exit(0)
            }

        })
    });

    request.on('error', (e) => {
        console.error(e);
    });
    request.end();
}