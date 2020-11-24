//import
const http2 = require('http2');
const https = require('https');
const http = require('http');

var account = {
    email: '',
    password: '',
}

//session object
var session = {
    time: new Date(),
    appId: '3587dcbb-7f81-457c-9781-0e3f29f6f56a',
    spaceId: '5172a557-50b5-4665-b7db-e3f2e8c5041d',
    sessionId: null,
    token: null,
};

//player object
var player = {
    username: '',
    id: null,
    platform: 'uplay',
    kills: null,
    deaths: null,
    rank: null,
};

//get session_id
function getSessionId(accountObj, sessionObj, playerObj) {
    var options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: '/v3/profiles/sessions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(accountObj.email + ':' + accountObj.password).toString('base64'),
            'Ubi-AppId': sessionObj.appId,
            'Ubi-RequestedPlatformType': playerObj.platform,
            //forms a persistent http connection instead of making a new connection every request, less cpu/memory usage
            'Connection': 'keep-alive',
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
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
        
                res.on('end', () => {
                    data = JSON.parse(data);
                    let token = data.ticket;
                    let ubiSessionId = data.sessionId;
                    console.log(data);
                    resolve([token, ubiSessionId]);
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
function getPlayerId(sessionObj, playerObj) {
    console.log(player.platform);
    var options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: `/v3/profiles?namesOnPlatform=${playerObj.username}&platformType=${playerObj.platform}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `ubi_v1 t=${sessionObj.token}`,
            'ubi-appid': sessionObj.appId,
            'ubi-sessionid': sessionObj.sessionId,
            'Connection': 'keep-alive',
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(options, res => {
                let data = '';
                res.on('error', e => {
                    err_call(e);
                });

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    data = JSON.parse(data);
                    console.log(data);
                    let playerId = data.profiles[0].profileId;
                    let playerName = data.profiles[0].nameOnPlatform;
                    resolve([playerId, playerName]);
                });
            });
            req.end();
        }
        catch (e) {
            reject(e);
        }
    });
}




function getPlayerRank(sessionObj, playerObj) {
    var options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: `/v1/spaces/${sessionObj.spaceId}/sandboxes/OSBOR_PC_LNCH_A/r6karma/players?board_id=pvp_ranked&season_id=-1&region_id=ncsa&profile_ids=${playerObj.id}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `ubi_v1 t=${sessionObj.token}`,
            'expiration': null,
            'Ubi-AppID': sessionObj.appId,
            'Ubi-SessionID': sessionObj.sessionId,
            'User-Agent': 'node.js',
            'Connection': 'keep-alive',
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(options, res => {
                let data = '';
                res.on('error', e => {
                    err_call(e);
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
        catch (e) {
            reject(e);
        }
    });
}

function getPlayerSummary(sessionObj, playerObj) {
    const authority = `https://r6s-stats.ubisoft.com/v1/current/operators/${playerObj.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200724&endDate=20201121`;
    var options = {
        ':authority': 'r6s-stats.ubisoft.com',
        ':method': 'GET',
        ':path': `/v1/current/operators/${playerObj.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200724&endDate=20201121`,
        ':scheme': 'https',
        'authorization': `ubi_v1 t=${sessionObj.token}`,
        'ubi-appid': sessionObj.appId,
        'ubi-sessionid': sessionObj.sessionId,
        'content-type': 'application/json',
        'user-agent': 'node.js',
        'expiration': genExpiration(sessionObj),
    }

    return new Promise((resolve, reject) => {
        try {
            //connect to authority
            const client = http2.connect(authority);
            let data = '';
            client.on('error', e => {
                reject(e);
            });
            //request
            const req = client.request(options);
            req.on('error', e => {
                reject(e);
            })

            req.on('data', chunk => {
                data += chunk;
            });

            req.on('end', () => {
                data = JSON.parse(data);
                console.log(data);
                client.close();
                //destructuring
                //const { teamRoles } = data.platforms.PC.gameModes.ranked;
                //console.log(teamRoles);
                resolve(data);
            }); 
            req.end();
        }
        catch (e) {
            reject(e);
        }
    });
}

//error
function errorCall(e) {
    console.error(e);
}

function genExpiration(sessionObj) {
    let time = sessionObj.time.getTime();
    //10000 ms = 10 seconds
    let expiration = 600000;
    console.log(new Date(time + expiration).toISOString());
    return new Date(time + expiration).toISOString();
}

async function fetch(accountObj, sessionObj, playerObj) {
    [session.token, session.sessionId] = await getSessionId(accountObj, sessionObj, playerObj);
    [player.id, player.name] = await getPlayerId(sessionObj, playerObj);
    var x = await getPlayerRank(sessionObj, playerObj);
    var stats_string = await getPlayerSummary(sessionObj, playerObj);
}

fetch(account, session, player);


//function outputFullSummary();