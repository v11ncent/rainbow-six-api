const http2 = require('http2');
const https = require('https');

// players array that holds players
let players = [];

// creates an account
function createAccount(email, password, platform) {
    if (account === undefined || password === undefined || platform === undefined) {
        console.error('Missing arguments. Requires: createAccount(email, passowrd, platform).');
    }
    return {
        email: email,
        password: password,
        platform: platform,
    }
}

// creates a session
function createSession(account) {
    if (account === undefined) {
        console.error('Missing arguments. Requires: createSession(account).');
    }
    // startDate() and endDate() fill the params for the subsequent requests. By default, I made it pull statistics from 2 months.
    // If you want to change the stat range, just change the months/days values in these functions.
    function startDate() {
        let startDate = new Date();
        // Subtracts 2 months from current date.
        let months = 2;
        startDate.setMonth(startDate.getMonth() - months);
        startDate = startDate.toISOString().split('T')[0].replace(/-/g,'');
        return startDate;
    }

    function endDate() {
        let endDate = new Date();
        // Subtracts 1 day from the current date.
        let days = 1;
        endDate.setDate(endDate.getDate() - days);
        endDate = endDate.toISOString().split('T')[0].replace(/-/g,'');
        return endDate;
    }

    // these values are static for now; change when Ubisoft makes a change to them
    let appId = '3587dcbb-7f81-457c-9781-0e3f29f6f56a';
    let spaceId = '5172a557-50b5-4665-b7db-e3f2e8c5041d';
    let options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: '/v3/profiles/sessions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(account.email + ':' + account.password).toString('base64'),
            'Ubi-AppId': appId,
            'Ubi-RequestedPlatformType': account.platform,
            'Connection': 'keep-alive',
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(options, res => {
                let data = '';
                res.on('error', e => {
                    throw new Error(e);
                });

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    data = JSON.parse(data);
                    let session = {
                        appId: appId,
                        spaceId: spaceId,
                        sessionId: data.sessionId,
                        token: data.ticket,
                        startDate: startDate(),
                        endDate: endDate(),
                    }
                    resolve(session);
                });
            });
            req.end();
        }
        catch (e) {
            reject(e);
        }
    });
}

// for troubleshooting session response
function getSessionResponse(account) {
    if (account === undefined) {
        console.error('Missing arguments. Requires: getSessionResponse(account).');
        return;
    }
    let appId = '3587dcbb-7f81-457c-9781-0e3f29f6f56a';
    let options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: '/v3/profiles/sessions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(account.email + ':' + account.password).toString('base64'),
            'Ubi-AppId': appId,
            'Ubi-RequestedPlatformType': account.platform,
            'Connection': 'keep-alive',
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(options, res => {
                let data = '';
                res.on('error', e => {
                    throw new Error(e);
                });

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    data = JSON.parse(data);
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

// creates player and adds to global player[] array
function createPlayer(username, platform, session) {
    if (username === undefined || platform === undefined || session === undefined) {
        console.error('Missing arguments. Requires: createPlayer(username, platform, session).');
        return;
    }
    let options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: `/v3/profiles?namesOnPlatform=${username}&platformType=${platform}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `ubi_v1 t=${session.token}`,
            'Ubi-AppID': session.appId,
            'Ubi-SessionID': session.sessionId,
            'Connection': 'keep-alive',
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(options, res => {
                let data = '';
                res.on('error', e => {
                    throw new Error(e);
                });

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    data = JSON.parse(data);
                    if (!(data.profiles[0] == undefined)) {
                        let id = data.profiles[0].profileId;
                        let player = {
                            username: username,
                            platform: platform,
                            id: id,
                            rank: null,
                            kills: null,
                            deaths: null,
                        }
                        players.push(player);
                        resolve(player);
                    }
                    else {
                        reject({ 'Error': 'Player not found.' });
                    }
                });
            });
            req.end();
        }
        catch (e) {
            reject(e);
        }
    });
}

// Platforms: PlayStation = psn, Xbox = xbl, PC = uplay
function getProfileResponse(username, platform, session) {
    if (username === undefined || platform === undefined || session === undefined) {
        console.error('Missing arguments. Requires: getProfileResponse(username, platform, session).');
        return;
    }
    let options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: `/v3/profiles?namesOnPlatform=${username}&platformType=${platform}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `ubi_v1 t=${session.token}`,
            'Ubi-AppID': session.appId,
            'Ubi-SessionID': session.sessionId,
            'Connection': 'keep-alive',
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(options, res => {
                let data = '';
                res.on('error', e => {
                    throw new Error(e);
                });

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    data = JSON.parse(data);
                    data = data.profiles[0];
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

// gets general stats of player (rank, kills, deaths, etc)
function getStats(player, session) {
    if (player === undefined || session === undefined) {
        console.error('Missing arguments. Requires: getStats(player, session).');
        return;
    }
    let options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: `/v1/spaces/${session.spaceId}/sandboxes/OSBOR_PC_LNCH_A/r6karma/players?board_id=pvp_ranked&season_id=-1&region_id=ncsa&profile_ids=${player.id}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `ubi_v1 t=${session.token}`,
            'Ubi-AppID': session.appId,
            'Ubi-SessionID': session.sessionId,
            'User-Agent': 'node.js',
            'Connection': 'keep-alive',
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(options, res => {
                let data = '';
                res.on('error', e => {
                    reject(e);
                });

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    data = JSON.parse(data);
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

// look up season chart in docs
function getStatsBySeason(player, session, season) {
    if (player === undefined || session === undefined || season === undefined) {
        console.error('Missing arguments. Requires: getStatsBySeason(player, session, season).');
        return;
    }
    let options = {
        host: 'public-ubiservices.ubi.com',
        port: 443,
        path: `/v1/spaces/${session.spaceId}/sandboxes/OSBOR_PC_LNCH_A/r6karma/player_skill_records?board_ids=pvp_ranked&season_ids=-${season}&region_ids=ncsa&profile_ids=${player.id}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `ubi_v1 t=${session.token}`,
            'Ubi-AppID': session.appId,
            'Ubi-SessionID': session.sessionId,
            'User-Agent': 'node.js',
            'Connection': 'keep-alive',
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(options, res => {
                let data = '';
                res.on('error', e => {
                    reject(e);
                });

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    data = JSON.parse(data);
                    let seasonSkillRecord = data.seasons_player_skill_records[0].regions_player_skill_records[0].boards_player_skill_records[0].players_skill_records;
                    resolve(seasonSkillRecord);
                });
            });
            req.end();
        }
        catch (e) {
            reject(e);
        }
    });
}

// team param is optional
function getStatsByOperator(player, session, team) {
    if (player === undefined || session === undefined) {
        console.error('Missing arguments. Requires: getStatsByOperator(player, session, [OPTIONAL]team).');
        return;
    }
    team = (team !== undefined) ? team : 'attacker,defender';
    // generates an expiration for expiration header
    function genExpiration() {
        let time = new Date();
        //1 hour -- set to what you like. Longer time = less frequent player updates
        let cacheTime = 1;
        time.setHours(time.getHours() + cacheTime);
        let expiration = time.toISOString();
        return expiration;
    }

    let options = {
        ':authority': 'r6s-stats.ubisoft.com',
        ':method': 'GET',
        ':path': `/v1/current/operators/${player.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=${team}&startDate=${session.startDate}&endDate=${session.endDate}`,
        ':scheme': 'https',
        'authorization': `ubi_v1 t=${session.token}`,
        'ubi-appid': session.appId,
        'ubi-sessionid': session.sessionId,
        'content-type': 'application/json',
        'user-agent': 'node.js',
        'expiration': genExpiration(),
    }

    const authority = `https://r6s-stats.ubisoft.com/v1/current/operators/${player.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=${session.startDate}&endDate=${session.endDate}`;
    return new Promise((resolve, reject) => {
        try {
            const client = http2.connect(authority);
            let data = '';
            client.on('error', e => {
                reject(e);
            });
            
            const req = client.request(options);
            req.on('error', e => {
                reject(e);
            });

            req.on('data', chunk => {
                data += chunk;
            });

            req.on('end', () => {
                data = JSON.parse(data);
                client.close();
                const { teamRoles } = data.platforms.PC.gameModes.ranked;
                resolve(teamRoles);
            });
            req.end();
        }
        catch (e) {
            reject(e);
        }
    });
}

module.exports = { createAccount, createSession, getSessionResponse, createPlayer, getProfileResponse, getStats, getStatsBySeason, getStatsByOperator, players };