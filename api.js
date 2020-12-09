//import
const http2 = require('http2');
const https = require('https');
const http = require('http');

var email = '';
var password = '';
var platform = 'uplay';


//ACCOUNT CLASS
var account = function() {
    //private
    var config;
    function initializeAccount(email, password, platform) {
        this.email = email;
        this.password = password;
        this.platform = platform;
    }

    //public
    return {
        createAccount: function(email, password, platform) {
            if (config === undefined) {
                config = new initializeAccount(email, password, platform);
                return config;
            }
        }
    }
}();

//SESSION CLASS
var session = function() {
   
    var config;
    function initializeSession() {
        this.appId  = '3587dcbb-7f81-457c-9781-0e3f29f6f56a';
        this.spaceId = '5172a557-50b5-4665-b7db-e3f2e8c5041d';
        this.sessionId = null;
        this.token = null;
    }

    function getSessionResponse(account) {
        var options = {
            host: 'public-ubiservices.ubi.com',
            port: 443,
            path: '/v3/profiles/sessions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(account.email + ':' + account.password).toString('base64'),
                'Ubi-AppId': config.appId,
                'Ubi-RequestedPlatformType': 'uplay',
                'Connection': 'keep-alive',
            }
        }
        return new Promise((resolve, reject) => {
            try {
                const req = https.request(options, res => {
                    let data = '';
                    res.on('error', e => {
                        throw new Error(e);
                    })
    
                    res.on('data', chunk => {
                        data += chunk;
                    })
    
                    res.on('end', () => {
                        data = JSON.parse(data);
                        resolve(data);
                    })
                })
                req.end();
            }
            catch (e) {
                reject(e);
            }
        })
    }

    //public methods
    return {
        createSession: async function(accountObj) {
            if (config === undefined) {
                config = new initializeSession();
                let data = await getSessionResponse(accountObj).catch(e => { console.log(e) });
                config.sessionId = data.sessionId;
                config.token = data.ticket;
                return config;
            }
        }
    }
}();

//PLAYER CLASS
var players = function() {
    var playersArray = [];
    function initializePlayer(username) {
        this.username = username;
        this.id = null;
        this.rank = null;
        this.kills = null;
        this.deaths = null;
    }
    
    function getPlayerInfo(player, session) {
        var options = {
            host: 'public-ubiservices.ubi.com',
            port: 443,
            path: `/v3/profiles?namesOnPlatform=${player.username}&platformType=uplay`,
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
                    })
    
                    res.on('data', chunk => {
                        data += chunk;
                    })
    
                    res.on('end', () => {
                        data = JSON.parse(data);
                        player.id = data.profiles[0].profileId;
                        resolve(data);
                    })
                })
                req.end();
            }
            catch (e) {
                reject(e);
            }
        })
    }

    function getPlayerRank(player, session) {
        var options = {
            host: 'public-ubiservices.ubi.com',
            port: 443,
            path: `/v1/spaces/${session.spaceId}/sandboxes/OSBOR_PC_LNCH_A/r6karma/players?board_id=pvp_ranked&season_id=-1&region_id=ncsa&profile_ids=${player.id}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `ubi_v1 t=${session.token}`,
                'Expiration': null,
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
                    })
    
                    res.on('data', chunk => {
                        data += chunk;
                    })
    
                    res.on('end', () => {
                        data = JSON.parse(data);
                        resolve(data);
                    })
                })
                req.end();
            }
            catch (e) {
                reject(e);
            }
        })
    }

    function getPlayerSummary(player, session) {
        var options = {
            ':authority': 'r6s-stats.ubisoft.com',
            ':method': 'GET',
            //I need to make the startDate & endDate dynamic
            ':path': `/v1/current/operators/${player.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200810&endDate=20201208`,
            ':scheme': 'https',
            'authorization': `ubi_v1 t=${session.token}`,
            'ubi-appid': session.appId,
            'ubi-sessionid': session.sessionId,
            'content-type': 'application/json',
            'user-agent': 'node.js',
            'expiration': genExpiration(),
        }

        const authority = `https://r6s-stats.ubisoft.com/v1/current/operators/${player.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200724&endDate=20201121`;
        return new Promise((resolve, reject) => {
            try {
                
                const client = http2.connect(authority);
                let data = '';
                client.on('error', e => {
                    reject(e);
                })
                
                const req = client.request(options);
                req.on('error', e => {
                    reject(e);
                })
    
                req.on('data', chunk => {
                    data += chunk;
                })
    
                req.on('end', () => {
                    data = JSON.parse(data);
                    client.close();
                    //this is a lot of data at once so do as you will, I commented it out for simplicity
                    //const { teamRoles } = data.platforms.PC.gameModes.ranked;
                    //resolve(teamRoles);
                    resolve(data);
                })
                req.end();
            }
            catch (e) {
                reject(e);
            }
        })
    }

    function genExpiration() {
        //1 hour expiration for quicker calls
        let time = new Date();
        let cacheTime = 1;
        time.setHours(time.getHours() + cacheTime);
        let expiration = time.toISOString();
        return expiration;
    }

    //public
    return {
        createPlayer: function(username) {
            newPlayer = new initializePlayer(username);
            playersArray.push(newPlayer);
            return newPlayer;
        },
        getPlayer: function(player) {
            for(let i = 0; i < playersArray.length; i++) {
                if(playersArray[i].username === player) {
                    return playersArray[i];
                }
                else if (i === playersArray.length - 1 && playersArray[i].username != player) {
                    return new Error('Player not found.');
                }
            }
        },
        getPlayerInfo: getPlayerInfo,
        getPlayerRank: getPlayerRank,
        getPlayerSummary: getPlayerSummary,
    }
}();


var newAccount = account.createAccount(email, password, platform);

async function print() {
    var session1 = await session.createSession(newAccount).catch(e => { console.log(e) });
    let player = players.createPlayer('OryxGaming_');
    let response = await players.getPlayerInfo(player, session1).catch(e => { console.log(e) });
    let summary = await players.getPlayerRank(player, session1).catch(e => { console.log(e) });
    console.log(summary);
}
print();
