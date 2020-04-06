const config = require("./config.json");
const Discord = require("discord.js");

const client = new Discord.Client();

let testing = true;

client.on("ready", () => {
    console.log("started...\nTesting: " + testing);

    if (testing) {
        for (let i = 1; i < 7; i++) {
            let username = "Tester" + i;
            playerUser[username] = "id" + i;
            teams["N/A"]["users"].push(username);
        }
        for (let i = 7; i < 9; i++) {
            let username = "Tester" + i;
            playerUser[username] = "id" + i;
            teams["AFK"]["users"].push(username);
        }
    }

});

let gamelink = "";
let playerUser = {};
let playerPool = [];
let teams = {
    "Team1": {
        "users": [],
        "count": -1
    },
    "Team2": {
        "users": [],
        "count": -1
    },
    "N/A": {
        "users": [],
        "count": -1
    },
    "AFK": {
        "users": [],
        "count": -1
    }
};

client.on("message", async message => {
    if (message.author.bot || message.content.indexOf(config.prefix) !== 0) return;

    let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();
    let command1 = args[0];
    let command2 = args[1];
    let command3 = args[2];

    if (command === "help") {
        message.channel.send(
            "**List of Commands:**\n\n" +
            "**" + config.prefix + "help** : show command options for bot.\n" +
            "**" + config.prefix + "user** {***user_name***} : create new or update existing user with the name, *user_name*.\n" +
            "**" + config.prefix + "teams** : see all teams and players currently in Team Creator.\n" +
            "**" + config.prefix + "assign** {***user_name***} {***team_name***} : moves user *user_name* to team *team_name*.\n" +
            "**" + config.prefix + "rename** {***team_original_name***} {***team_new_name***}: rename a team's name.\n" +
            "**" + config.prefix + "link** {***link url***}: set the url for the game, if any.\n"
        );
    }

    if (command === "user") {
        let username = command1;

        if (command2) {
            message.channel.send("Your username cannot contain spaces.\nPlease try again with a different username.");
            return;
        }
        if (username.length > 15 || username.length < 2) {
            message.channel.send("Your username must be between 3 and 15 characters long.\nPlease try again with a different username.");
            return;
        }

        if (!playerUser[username]) {
            let action = "added";

            let ogUsername = getKeyByValue(playerUser, message.author);
            if (ogUsername) {
                removeUserFromTeams(ogUsername, username);
                delete playerUser[ogUsername];
                action = "updated";
            }

            if (action === "added") {
                teams["N/A"]["users"].push(username);
            }
            playerUser[username] = message.author;
            message.channel.send("You have sucessfully been *" + action + "* as user: **" + username + "**");
        } else {
            message.channel.send("User **" + username + "** already exists.\nPlease try again with a different username.");
        }
    }

    if (command === "teams") {
        let total = "\n";
        if(gamelink) total += "Link: <" + gamelink + ">\n\n";

        for (let team in teams) {
            if(team !== "N/A" && team !== "AFK"){
                printTeams(team);
            }
        }
        for (let team in teams) {
            if(team === "N/A" || team === "AFK"){
                printTeams(team);
            }
        }
        // total += "Total = " + Object.keys(playerUser).length +"\n";

        message.channel.send(
            total
        );

        function printTeams(team){
            if (teams.hasOwnProperty(team)) {
                total += "**" + team + ":**\n";

                teams[team]["users"].forEach(p => {
                    total += p + "\n";
                });
            }
            total += "\n";
        }
    }

    if (command === "assign") {
        let username = command1;
        let teamname = command2;

        if (!doesUsernameExist(username, message) || !doesTeamnameExist(teamname, message)) {
            return;
        }

        removeUserFromTeams(username);
        teams[teamname]["users"].push(username);

        message.channel.send(
            "User **" + username + "** has successfully been moved to team **" + teamname + "**."
        );
    }

    if (command === "rename") {
        let ogName = command1;
        let newName = command2;

        if (command3) {
            message.channel.send("Team names cannot contain spaces.\nPlease try again with a different name.");
            return;
        }
        if(ogName === "N/A" || ogName === "AFK"){
            message.channel.send("Team name **" + ogName + "** is not allowed to be changed.");
            return;
        }
        if (newName.length > 15 || newName.length < 2) {
            message.channel.send("Team names must be between 3 and 15 characters long.\nPlease try again with a different name.");
            return;
        }
        if (!doesTeamnameExist(ogName, message)) {
            return;
        }
        if (doesTeamnameExist(newName, message, false)) {
            message.channel.send(
                "Team **" + newName + "** already exists. Please try again with a different name."
            );
            return;
        }

        renameKey(teams, ogName, newName);

        message.channel.send(
            "Team **" + ogName + "** has successfully been updated to team **" + newName + "**."
        );
    }

    if (command === "link") {
        let content = args.join(" ");
        gamelink = content;

        message.channel.send("Link has been updated.");
    }
});

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function removeUserFromTeams(username, update) {
    let found = false;
    for (let team in teams) {
        if (teams.hasOwnProperty(team)) {
            for (let p of teams[team]["users"]) {
                if (p === username) {
                    if (update) teams[team]["users"][teams[team]["users"].indexOf(p)] = update;
                    else teams[team]["users"].splice(teams[team]["users"].indexOf(p), 1);
                    found = true;
                    break;
                }
            }
        }
        if (found) break;
    }
}

function doesUsernameExist(username, message, msg = true) {
    if (!playerUser[username]) {
        if (msg) {
            message.channel.send(
                "User **" + username + "** does not exist. Please try again."
            );
        }
        return false;
    } else return true;
}

function doesTeamnameExist(teamname, message, msg = true) {
    if (!teams[teamname]) {
        if (msg) {
            message.channel.send(
                "Team **" + teamname + "** does not exist. Please try again."
            );
        }
        return false;
    } else return true;
}

function renameKey(obj, oldk, newk){
    if (oldk !== newk) {
        Object.defineProperty(obj, newk,
            Object.getOwnPropertyDescriptor(obj, oldk));
        delete obj[oldk];
    }
}

client.login(config.token);