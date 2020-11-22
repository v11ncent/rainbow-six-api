//import
const http2 = require('http2');
const https = require('https');
const http = require('http');

var email = '';
var password = '';
var username = 'OryxGaming_';

//session object
var session = {
    app_id: '3587dcbb-7f81-457c-9781-0e3f29f6f56a',
    space_id: '5172a557-50b5-4665-b7db-e3f2e8c5041d',
    session_id: null,
    token: null,
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
                    let token = res_body.ticket;
                    let ubi_sessionid = res_body.sessionId;
                    resolve([token, ubi_sessionid]);
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
            'Authorization': `ubi_v1 t=${session.token}`,
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

function get_player_rank(session, player) {
    var options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: `/v1/spaces/${session.space_id}/sandboxes/OSBOR_PC_LNCH_A/r6karma/players?board_id=pvp_ranked&season_id=-1&region_id=ncsa&profile_ids=${player.id}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `ubi_v1 t=${session.token}`,
            'expiration': null,
            'Ubi-AppID': session.app_id,
            'Ubi-SessionID': session.session_id,
            'User-Agent': 'node.js',
        }
    };
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(options, res => {
                let data = '';
                res.on('error', err => {
                    err_call(err);
                });

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    data = JSON.parse(data);
                    console.log(data);
                    resolve(data);
                });
            });
            req.end();
        }
        catch (error) {
            reject(error);
        }
    });
}

function get_player_summary(session, player) {
    const authority = `https://r6s-stats.ubisoft.com/v1/current/operators/${player.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200724&endDate=20201121`;
    return new Promise((resolve, reject) => {
        try {
            const client = http2.connect(authority);
            let data = '';
            client.on('error', err => {
                reject(err);
            });

            var options = {
                ':authority': 'r6s-stats.ubisoft.com',
                ':method': 'GET',
                ':path': `/v1/current/operators/${player.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200724&endDate=20201121`,
                ':scheme': 'https',
                'authorization': `ubi_v1 t=${session.token}`,
                'ubi-appid': session.app_id,
                'ubi-sessionid': session.session_id,
                'content-type': 'application/json',
                'user-agent': 'node.js',
                'expiration': '2020-11-22T09:17:20.344Z',
            }

            const req = client.request(options);

            req.on('error', err => {
                reject(err);
            })

            req.on('data', chunk => {
                data += chunk;
            });

            req.on('end', () => {
                data = JSON.parse(data);
                client.close();
                //destructuring
                const { teamRoles } = data.platforms.PC.gameModes.ranked;
                console.log(teamRoles);
                resolve(data);
            }); 
            req.end();
        }
        catch (err) {
            err_call(err);
        }
    });
}

//error
function err_call(err) {
    console.error(err);
}

async function fetch(user) {
    [session.token, session.session_id] = await get_session_id(email, password);
    [player.id, player.name] = await get_player_id(session, user);
    var x = await get_player_rank(session, player);
    var stats_string = await get_player_summary(session, player);
}

fetch(username);
