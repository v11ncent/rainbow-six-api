/*resources:
    on promises:
        https://softwareengineering.stackexchange.com/questions/279898/how-do-i-make-a-javascript-promise-return-something-other-than-a-promise/279899
    on classes:
        //https://www.toptal.com/javascript/comprehensive-guide-javascript-design-patterns#:~:text=Some%20examples%20discussed%20in%20the,pattern%2C%20and%20the%20facade%20pattern

*/

//import
const http2 = require('http2');
const https = require('https');
const http = require('http');

var email = '';
var password = '';
var platform = 'uplay';
var username = '';

//CLASSES
//######################################################################################################################################

//ACCOUNT CLASS
var account = (function() {
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
                return account;
            }
        },
        getAccount: function() {
            return config;
        },
        getEmail: function() {
            return config.email;
        },
        getPassword: function() {
            return config.password;
        }
    }
})();

//SESSION CLASS
var session = function() {
    //private methods
    var config;
    function initializeSession() {
        this.time = new Date();
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
                'Authorization': 'Basic ' + Buffer.from(account.getEmail() + ':' + account.getPassword()).toString('base64'),
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
                        err_call(e);
                    });
    
                    res.on('data', chunk => {
                        data += chunk;
                    });
    
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
                let data = await getSessionResponse(accountObj);
                config.sessionId = data.sessionId;
                config.token = data.ticket;
                return session;
            }
        },
        getSession: function() {
            return config;
        },
        getSessionId: function() {
            return config.sessionId;
        },
        getAppId: function() {
            return config.appId;
        },
        getSpaceId: function() {
            return config.spaceId;
        },
        getTime: function() {
            return config.time;
        },
        getToken: function() {
            return config.token;
        },
    }
}();

//PLAYER CLASS
var player = function() {
    var players = [];

    function initializePlayer(username) {
        this.username = username,
        this.id = null,
        this.rank = null,
        this.kills = null,
        this.deaths = null
    }
    
    function getPlayerResponse(session) {
        var options = {
            host: 'public-ubiservices.ubi.com',
            port: 443,
            path: `/v3/profiles?namesOnPlatform=${data.username}&platformType=uplay`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `ubi_v1 t=${session.getToken()}`,
                'ubi-appid': session.getAppId(),
                'ubi-sessionid': session.getSessionId(),
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

    function getPlayerRank(session) {
        var options = {
            host: 'public-ubiservices.ubi.com',
            port: 443,
            path: `/v1/spaces/${session.config.spaceId}/sandboxes/OSBOR_PC_LNCH_A/r6karma/players?board_id=pvp_ranked&season_id=-1&region_id=ncsa&profile_ids=${player.id}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `ubi_v1 t=${session.config.token}`,
                'expiration': null,
                'Ubi-AppID': session.config.appId,
                'Ubi-SessionID': session.config.sessionId,
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

    function getPlayerSummary(session) {
        var options = {
            ':authority': 'r6s-stats.ubisoft.com',
            ':method': 'GET',
            ':path': `/v1/current/operators/${data.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200724&endDate=20201121`,
            ':scheme': 'https',
            'authorization': `ubi_v1 t=${session.config.token}`,
            'ubi-appid': session.config.appId,
            'ubi-sessionid': session.config.sessionId,
            'content-type': 'application/json',
            'user-agent': 'node.js',
            'expiration': generateExpiration(session),
        }

        const authority = `https://r6s-stats.ubisoft.com/v1/current/operators/${data.id}?gameMode=all,ranked,casual,unranked&platform=PC&teamRole=attacker,defender&startDate=20200724&endDate=20201121`;
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

    function generateExpiration(session) {
        let time = session.config.time.getTime();
        //10000 ms = 10 seconds
        let expiration = 600000;
        console.log(new Date(time + expiration).toISOString());
        return new Date(time + expiration).toISOString();
    }

    //public
    return {
        createPlayer: function(username) {
            data = new initializePlayer(username);
            players.push(data);
            return player;
        },
        getPlayer: function(player) {
            var found = players.find(players => {
                players.username === 'OryxGaming_';
            })
            return found;
        },
        getPlayerResponse: getPlayerResponse,
        setPlayerId: getPlayerResponse,
        //setPlayerRank: getPlayerRank,
        //setPlayerSummary: getPlayerSummary,
    }
}();
//######################################################################################################################################


var newAccount = account.createAccount(email, password, platform);
var printAccount = newAccount.getAccount();
console.log(printAccount);
async function print() {
    var session1 = await session.createSession(newAccount);
    var player1 = await player.createPlayer('OryxGaming_');
    var player2 = await player.createPlayer('OryxGaming131231_')
    console.log(player1.getPlayer());
    var playerRes = await player1.getPlayerResponse(session1);
}
print();
