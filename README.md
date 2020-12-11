# r6-api
Rainbow Six api for getting player statistics.

# Important
Ubisoft's website is structured in a way where you must be logged in before you can get player statistics. Therefore, you
must make an account with Ubisoft(assuming you don't already have one) and provide a VALID username and password. Don't worry, I didn't add any sketchy code.
This is a very early version, and for sure it will be buggy. Please leave feedback for me as I'm really new; this is my first real-world project! :)

With that out of the way, I will be making a little wiki for every function. As an important side note, each request must be sequential.
On the bottom of api.js, I have an example request. Follow that. I'll also bundle it into a module for actual use.

# Example Usage

var newAccount = account.createAccount(email, password, platform);
async function print() {
    var session1 = await session.createSession(newAccount).catch(e => { console.log(e) });
    let player = players.createPlayer('OryxGaming_');
    let response = await players.getPlayerInfo(player, session1).catch(e => { console.log(e) });
    let summary = await players.getPlayerRank(player, session1).catch(e => { console.log(e) });
    console.log(summary);
}

print();