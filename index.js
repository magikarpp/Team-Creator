const config = require("./config.json");
const Discord = require("discord.js");

const client = new Discord.Client();

let testing = true;

client.on("ready", () => {
    console.log("started...\nTesting: " + testing);

    if (testing) {
        for (let i = 1; i < 10; i++) {
            let username = "Tester" + i;
            playerUser[username] = "id" + i;
            teams["N/A"]["users"].push(username);
        }
        for (let i = 10; i < 13; i++) {
            let username = "Tester" + i;
            playerUser[username] = "id" + i;
            teams["AFK"]["users"].push(username);
        }
    }

});

let gamelink = "";
let playerUser = {};
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
            "**" + config.prefix + "assign** full : assigns all users (including users already in a team) to random teams.\n" +
            "**" + config.prefix + "assign** auto : automatically assign all unassigned users to available teams randomly.\n" +
            "**" + config.prefix + "assign** manual {***user_name***} {***team_name***} : moves single user *user_name* to team *team_name*.\n" +
            "**" + config.prefix + "unassign** : unassigns all users in teams.\n" +
            "**" + config.prefix + "rename** {***team_original_name***} {***team_new_name***} : rename a team's name.\n" +
            "**" + config.prefix + "link** {***link url***} : set the url for the game, if any.\n" +
            "**" + config.prefix + "create auto** {***integer***} : create *integer* amount of teams that are evenly divided and have no user limits.\n" +
            "**" + config.prefix + "create manual** {***team_name***} {***integer***} ... : create teams with *team_name* and max user count of *integer*.\n" +
            "Ex. " + config.prefix + "create manual Red 3 Blue 3 Host 1\n- Creates 3 teams; Red, Blue and Host. Red and Blue can have 3 users in their team while Host can only have 1.\n" +
            "Ex. " + config.prefix + "create manual Hooligans -1 Goons -1 Pigeon 1 Potatoes 2\n- Teams Hooligans and Goons can have unrestricted amounts of users while Pigeon and Potatoes can only have 1 and 2 respectively.\n" +
            "\n" +
            "**" + config.prefix + "play codenames** : sets up Team Creator to play CodeNames.\n" +
            "**" + config.prefix + "play rps** {***user_name***}: play rock paper scissors against *user_name*.\n" +
            "**" + config.prefix + "random user: display a random *user_name*.\n" +
            "**" + config.prefix + "random number {***lower_bound***} {***upper_bound***}: display a random number between *lower_bound* and *upper_bound*.\n" +
            ""
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
            message.channel.send("You have been *" + action + "* as user: **" + username + "**");
        } else {
            message.channel.send("User **" + username + "** already exists.\nPlease try again with a different username.");
        }
    }

    if (command === "teams") {
        message.channel.send(
            displayTeams()
        );
    }

    if (command === "assign") {
        let type = command1;
        let username = command2;
        let teamname = command3;

        if (type === "full") {
            unassignAllUsers();
            assignAllUsers(message, false);
            let total = displayTeams() + "All users have been shuffled into teams.";
            message.channel.send(total);
        }

        if (type === "auto") {
            assignAllUsers(message, false);
            let total = displayTeams() + "All remaining users have been shuffled into teams.";
            message.channel.send(total);
        }

        if (type === "manual") {
            assignUserToTeam(username, teamname, message, true);
        }
    }

    if (command === "unassign") {
        unassignAllUsers();

        message.channel.send("All users have been unassigned.");
    }

    if (command === "rename") {
        let ogName = command1;
        let newName = command2;

        if (command3) {
            message.channel.send("Team names cannot contain spaces.\nPlease try again with a different name.");
            return;
        }
        if (ogName === "N/A" || ogName === "AFK") {
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

    if (command === "create") {
        let type = command1;

        if (type === "auto") {
            if (!isNaN(command2) && (parseInt(command2) <= 15 && parseInt(command2) > 1)) {
                unassignAllUsers();
                removeAllTeams();

                for (let i = 1; i < parseInt(command2) + 1; i++) {
                    teams["Team" + i] = {
                        "users": [],
                        "count": -1
                    }
                }

                message.channel.send("**" + command2 + "** teams have been created.");
                return
            } else {
                message.channel.send("You must enter an integer value between 2 and 15 to create teams. Please try again.");
                return;
            }
        }

        if (type === "manual") {
            args.shift();
            let checker = [];
            for (let i = 0; i < args.length; i++) {
                if (i % 2) {
                    if (isNaN(args[i]) || (parseInt(args[i]) < 1 && parseInt(args[i]) != -1)) {
                        message.channel.send("Every team must have an integer value greater than 1 (or -1 for no limit) representing its max count. Please try again.");
                        return;
                    }
                } else {
                    if (args[i] === "N/A" || args[i] === "AFK") {
                        message.channel.send("Team name **" + args[i] + "** is not allowed as a name.");
                        return;
                    }
                    if (args[i].length > 15 || args[i].length < 2) {
                        message.channel.send("Team names must be between 3 and 15 characters long.\nPlease try again with a different name.");
                        return;
                    }
                    checker.push(args[i]);
                }
            }

            if (new Set(checker).size !== checker.length) {
                message.channel.send("Team names cannot be duplicates.\nPlease try again with a different name.");
                return;
            }

            unassignAllUsers();
            removeAllTeams();
            for (let i = 0; i < args.length; i = i + 2) {
                teams[args[i]] = {
                    "users": [],
                    "count": parseInt(args[i + 1])
                }
            }
            message.channel.send("**" + checker.length + "** teams have been created.");
        }
    }

    if (command === "play") {
        if(command1 === "codenames"){
            unassignAllUsers();
            removeAllTeams();

            teams["RedSpyMaster"] = {
                "users": [],
                "count": 1
            }
            teams["Red"] = {
                "users": [],
                "count": -1
            }
            teams["BlueSpyMaster"] = {
                "users": [],
                "count": 1
            }
            teams["Blue"] = {
                "users": [],
                "count": -1
            }
            message.channel.send("Team Creator has been set up with CodeNames settings.");
        }
        if(command1 === "rps"){
            let player = playerUser[message.author];
            let opponent = command2;

            if(doesUsernameExist(opponent, message)){
                client.users.get(playerUser[opponent]).send(
                    "You have been challenged to Rock Paper Scissors By **" + player + "**!\n" +
                    "Please respond in a common discord server between both players.\n"
                );
            }
        }
    }

    if (command === "random") {
        if(command1 === "user"){
            message.channel.send("Here is a randomly selected user: **" + shuffleArray(Object.keys(playerUser).slice())[0] + "**.");
        }
        if(command1 === "number"){
            let lower = parseInt(command2);
            let upper = parseInt(command3);

            if(!isNaN(lower) && !isNaN(upper) && lower > 0 && upper > lower){
                message.channel.send("Here is a randomly selected number: **" + (Math.floor(Math.random() * (upper - lower + 1)) + lower) + "**.");
            } else{
                message.channel.send("Not a valid input. Please try again.");
            }
        }
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

function displayTeams() {
    let total = " \n";
    if (gamelink && gamelink.length > 0) total += "Link: <" + gamelink + ">\n\n";

    for (let team in teams) {
        if (team !== "N/A" && team !== "AFK") {
            printTeams(team);
        }
    }

    total += "----------\n"

    for (let team in teams) {
        if (team === "N/A" || team === "AFK") {
            printTeams(team);
        }
    }
    // total += "Total = " + Object.keys(playerUser).length +"\n";

    return total;

    function printTeams(team) {
        if (teams.hasOwnProperty(team)) {
            let count = "";
            if (teams[team]["count"] && teams[team]["count"] != -1) {
                count = "** (" + teams[team]["count"] + ")**";
            }
            total += "**" + team + count + ":**\n";

            teams[team]["users"].forEach(p => {
                total += p + "\n";
            });
        }
        total += "\n";
    }
}

function unassignAllUsers() {
    for (let team in teams) {
        if (team != "N/A" && team != "AFK") {
            if (teams.hasOwnProperty(team)) {
                teams["N/A"]["users"] = teams["N/A"]["users"].concat(teams[team]["users"]);
                teams[team]["users"] = [];
            }
        }
    }
}

function assignAllUsers(message, msg) {
    let allUsers = shuffleArray(teams["N/A"]["users"].slice());

    allUsers.forEach(u => {
        assignUserToTeam(u, undefined, message, msg);
    });
}

function assignUserToTeam(username, teamname, message, msg) {
    if (!doesUsernameExist(username, message, msg) || teamname ? !doesTeamnameExist(teamname, message, msg) : false) {
        return;
    }

    if (teamname) {
        if (teams[teamname]["count"] == -1 || teams[teamname]["users"].length < teams[teamname]["count"]) {
            removeUserFromTeams(username);
            teams[teamname]["users"].push(username);

            if (msg) {
                message.channel.send(
                    "User **" + username + "** has been moved to team **" + teamname + "**."
                );
            }
        } else {
            if (msg) {
                message.channel.send(
                    "Team **" + teamname + "** is already full. Please select a different team."
                );
            }

        }
    } else {
        let lowest;
        let lowCount;

        for (let team in teams) {
            if (team != "N/A" && team != "AFK") {
                if (teams.hasOwnProperty(team)) {
                    let teamMax = teams[team]["count"];
                    let teamLength = teams[team]["users"].length;
                    if (teamMax === -1) teamMax = 9999;

                    if ((lowCount == undefined || teamLength < lowCount) && teamLength < teamMax) {
                        lowCount = teamLength;
                        lowest = team;
                    }
                }
            }
        }

        if(!lowest) lowest = "N/A";

        removeUserFromTeams(username);
        teams[lowest]["users"].push(username);
        if (msg) message.channel.send("User **" + username + "** has been added to Team **" + lowest + "**.");
    }

}

function removeAllTeams() {
    for (let team in teams) {
        if (team != "N/A" && team != "AFK") {
            if (teams.hasOwnProperty(team)) {
                delete teams[team];
            }
        }
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

function renameKey(obj, oldk, newk) {
    if (oldk !== newk) {
        Object.defineProperty(obj, newk,
            Object.getOwnPropertyDescriptor(obj, oldk));
        delete obj[oldk];
    }
}

function shuffleArray(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

client.login(config.token);