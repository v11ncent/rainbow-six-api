//import
const http2 = require('http2');
const https = require('https');
const http = require('http');
const app = require('./app.js');
const got = require('got');

var email = app.email;
var password = app.password;
var username = app.username;

//session object
var session = {
    //static
    app_id: '3587dcbb-7f81-457c-9781-0e3f29f6f56a',
    //this is static even though there's a json property that returns another value ???????
    space_id: '5172a557-50b5-4665-b7db-e3f2e8c5041d',
    session_id: null,
    ticket: null,
};

//player object
var player = {
    name: null,
    id: null,
    platform: 'uplay',
    kills: null,
    deaths: null,
    rank: null,
};

//get session_id
//options is the official name for the param
//but its just specifying the header
function get_session_id(email, password) {
    var options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: '/v3/profiles/sessions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(email + ':' + password).toString('base64'),
            'Ubi-AppId': session.app_id,
            'Ubi-RequestedPlatformType': player.platform,
        }
    }
    //on promises:
    //https://softwareengineering.stackexchange.com/questions/279898/how-do-i-make-a-javascript-promise-return-something-other-than-a-promise/279899
    //main advantage to promises is that it avoids callback hell
    //callback hell is essentially a lot of async functions nested in each other in a function
    //if one function returns an error, it makes the code a lot harder to debug 
    return new Promise((resolve, reject) => {
        const req_session_id = https.request(options, res => {
            try { 
                let res_body = '';
                res.on('data', data => {
                    res_body += data;
                });
        
                res.on('end', () => {
                    res_body = JSON.parse(res_body);
                    console.log(res_body);
                    let ticket = res_body.ticket;
                    let Ubi_SessionId = res_body.sessionId;
                    console.log(Ubi_SessionId);
                    resolve([ticket, Ubi_SessionId]);
                });

                res.on('error', err => {
                    reject(err_call(err));
                });
            }
            catch (err) {
                err_call(err);
            }
        });
        req_session_id.end();
    });
}

//retrieve player_id
function get_player_id(session, username) {
    var options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: `/v3/profiles?namesOnPlatform=${username}&platformType=${player.platform}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'ubi_v1 t=' + session.ticket,
            'ubi-appid': session.app_id,
            'ubi-sessionid': session.session_id,
            'ubi-requestedPlatformType': player.platform,
        }
    };
    return new Promise((resolve, reject) => {
        const req_player_id = https.request(options, res => {
            try { 
                let res_body = '';
                res.on('data', data => {
                    res_body += data;
                });
        
                res.on('end', () => {
                    res_body = JSON.parse(res_body);
                    console.log(res_body);
                    let player_id = res_body.profiles[0].profileId;
                    let player_name = res_body.profiles[0].nameOnPlatform;
                    resolve([player_id, player_name]);
                });

                res.on('error', err => {
                    reject(err_call(err));
                });
            }
            catch (err) {
                err_call(err);
            }
        });
        req_player_id.end();
    });
}

//retrieve player_stats
//http2 request
function get_player_stats(session, player) {
    var platform = 'PC';
    if (player.platform === 'uplay') {
        platform = 'PC';
    }

    var options = {
        authority: 'r6s-stats.ubisoft.com',
        method: 'GET',
        path: '/v1/current/operators/e96ae749-8939-43ed-895f-bf1817e849d9?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200722&endDate=20201119',
        scheme: 'https',
        headers: {
            //'content-type': 'application/json',
            'authorization': 'ubi_v1 t=' + session.ticket,
            'ubi-appid': session.app_id,
            'ubi-sessionid': session.session_id,
            'user-agent': 'node.js',
        }
    };

    var options2 = {
        'content-type': 'application/json',
        'authorization': 'ubi_v1 t=' + session.ticket,
        'ubi-appid': session.app_id,
        'ubi-sessionid': session.session_id,
        'user-agent': 'node.js',
    }

    try {
        const response = got(`https://r6s-stats.ubisoft.com/v1/current/operators/e96ae749-8939-43ed-895f-bf1817e849d9?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200722&endDate=20201119`, {http2: true, headers: options2});
        console.log(response);
    }
    catch (err) {
        console.log(err);
    }
}

    
function get_player_stats2(session, player) {

    const authority = 'https://r6s-stats.ubisoft.com:443';

    return new Promise((resolve, reject) => {
        const client = http2.connect(authority);

        client.on('error', err => {
            reject(console.error(err));
        });

        const req = client.request({
            ':scheme': 'https',
            ':method': 'GET',
            ':authority': 'r6s-stats.ubisoft.com',
            ':path': `/v1/current/operators/e96ae749-8939-43ed-895f-bf1817e849d9?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200722&endDate=20201119`,
            'authorization': 'ubi_v1 t=' + session.ticket,
            'ubi-appid': session.app_id,
            'ubi-sessionid': session.session_id,
            'user-agent': 'node.js',
        });

        let res_body = '';
        req.on('response', (headers, flags) => {
            for (const name in headers) {
                console.log(`${name}: ${headers[name]}`);
            }
        });
        
        req.on('data', data => {
            res_body += data;
        });
        
        req.on('end', () => {
            res_body = JSON.parse(res_body);
            console.log(res_body);
            client.close();
            resolve ('value');
        }); 
        req.end();
    });
}
//error
function err_call(err) {
    console.log(http.STATUS_CODES[err]);
}

//using Promises to make the functions sequential/synchronous
//because every new function relies on the previous function's return value(s)
//https://stackoverflow.com/questions/35612428/call-async-await-functions-in-parallel
//https://medium.com/javascript-in-plain-english/async-await-javascript-5038668ec6eb#:~:text=The%20await%20operator%20is%20used,not%20the%20whole%20program%20execution.
async function fetch(user) {
    [session.ticket, session.session_id] = await get_session_id(email, password);
    [player.id, player.name] = await get_player_id(session, user);
    var stats_string = await get_player_stats2(session, player);
    console.log(stats_string);
}

fetch(username);
