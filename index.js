//I was too sleep deprived to remember how any of this works. If you don't understand something, God help you.
const {
    REST,
    Routes,
    Client,
    GatewayIntentBits
    
} = require("discord.js");
const FileSystem = require("fs");
const { token } = require("./token.json");
const { loggedUsers } = require("./users.json");
//include the embed builder
const { EmbedBuilder } = require("discord.js");

// I don't care if this setup is dated. If it works, it works.
const commands = [
    {
        name: "register",
        description: "register with your student ID, and Name",
        options: [
            {
                name: "id",
                description: "Your student ID",
                type: 3,
                required: true,
            },
            {
                name: "name",
                description: "Your name",
                type: 3,
                required: true,
            },
        ]
        
    },{
        name: "clear",
        description: "removes all instances of a member from the registration queue",
        options: [
            {
                name: "member",
                description: "The member to remove",
                type: 6,
                required: true,
            },
        ],
    },{
        name: "check",
        description: "Checks if a user is in the registration queue",
        options: [
            {
                name: "member",
                description: "The discord user to check",
                type: 6,
                required: true,
            },
        ],
    },{
        name: "remove",
        description: "removes only the most recent request from a member from the registration queue",
        options: [
            {
                name: "member",
                description: "The member to remove",
                type: 6,
                required: true,
            },
        ],
    }
];

const rest = new REST({ version: "10" }).setToken(
    token
);

(async () => {
    try {
        console.log("Sending commands to discord.");

        await rest.put(Routes.applicationCommands("1174975461990879302"), {
            body: commands,
        });

        console.log("Finished sending commands to discord.");
    } catch (error) {
        console.log("Error sending commands to discord. Halting.");
        console.error(error);
        process.exit(1);
    }
})();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (!interaction.guildId) return;
    //set activity to processing
    client.user.setActivity("Processing registrations");

    if (interaction.member.roles.cache.has("1176935795135889429")) {
        await interaction.reply("You've already been registered.");
        return;
    }
    if (interaction.commandName === "register") {
        const id = interaction.options.getString("id");
        const name = interaction.options.getString("name");
        console.log(`${interaction.user.username} registered with ID: ${id} and name: ${name}`);
        await interaction.reply(`Adding \`ID: ${id}\` and \`name: ${name}\` to the registration queue under the name ${interaction.user.username}`);

        FileSystem.readFile("./users.json", (err, data) => {
            if (err) console.log(err);
            try {
                var userarray = JSON.parse(data);
                if (!Array.isArray(userarray)) {
                    throw new Error("Invalid data in users.json");
                }
            } catch (error) {
                console.error("Failed to parse users.json, halting");
                process.exit(1);
            }
            //check if user is already registered
            var firsttime = true;
            for (let i = 0; i < userarray.length; i++) {
                if (userarray[i].id === `${interaction.user.id} Pastable: <@${interaction.user.id}>`) {
                    var firsttime = false;
                }
            }

            //push new user to array
            userarray.push({
                "id": `${interaction.user.id} Pastable: <@${interaction.user.id}>`,
                "username": `@${interaction.user.username}`,
                "DeclaredName": name,
                "DeclaredID": id,
                "firsttime": firsttime
            });

            //write array to users.json
            FileSystem.writeFile("./users.json", JSON.stringify(userarray, null, 2), (err) => {
                if (err) console.log(err);
                interaction.editReply(`Added ${interaction.user.username} to the registration queue.`);
            });
        });
    }
    if (interaction.commandName === "clear") {
        const member = interaction.options.getMember("member");
        console.log(`Checking if ${member.user.username} is in the queue.`);
        await interaction.reply(`Checking if ${member.user.username} is in the queue.`);
        FileSystem.readFile("./users.json", (err, data) => {
            if (err) console.log(err);
            try {
                var userarray = JSON.parse(data);
                if (!Array.isArray(userarray)) {
                    throw new Error("Invalid data in users.json");
                }
            } catch (error) {
                console.error("Failed to parse users.json, halting");
                process.exit(1);
            }
            //check if user is already registered
            if (userarray.some(e => e.id === `${member.id} Pastable: <@${member.id}>`)) {
                console.log(`${member.user.username} is in the queue. Removing.`);
                userarray = userarray.filter(e => e.id !== `${member.id} Pastable: <@${member.id}>`);
                FileSystem.writeFile("./users.json", JSON.stringify(userarray, null, 2), (err) => {
                    if (err) console.log(err);
                    interaction.editReply(`Removed ${member.user.username} from the registration queue.`);
                });
            } else {
                console.log(`${member.user.username} is not in the queue.`);
                interaction.editReply(`${member.user.username} is not in the queue.`);
            }
        });
        
    }

    if (interaction.commandName === "check") {
        const member = interaction.options.getMember("member");
        console.log(`Checking if ${member.user.username} is in the queue.`);
        await interaction.reply(`Checking if ${member.user.username} is in the queue.`);
        FileSystem.readFile("./users.json", (err, data) => {
            if (err) console.log(err);
            try {
                var userarray = JSON.parse(data);
                if (!Array.isArray(userarray)) {
                    throw new Error("Invalid data in users.json");
                }
            } catch (error) {
                console.error("Failed to parse users.json, halting");
                process.exit(1);
            }
            //reverse the order of the queue, so that the newest is first
            userarray.reverse();
            //check if user is already registered
            if (userarray.some(e => e.id === `${member.id} Pastable: <@${member.id}>`)) {
                console.log(`${member.user.username} is in the queue.`);
                interaction.editReply({content: `${member.user.username} is in the queue.`, embeds: [new EmbedBuilder().setTitle("User Info").setDescription(`**Name on student ID:** ${userarray.find(e => e.id === `${member.id} Pastable: <@${member.id}>`).DeclaredName}\n**Student ID:** ${userarray.find(e => e.id === `${member.id} Pastable: <@${member.id}>`).DeclaredID}\n **User ID: ${userarray.find(e => e.id === `${member.id} Pastable: <@${member.id}>`).id}`).setColor("#00ff00")]});
            } else {
                console.log(`${member.user.username} is not in the queue.`);
                interaction.editReply({content: `${member.user.username} is not in the queue.`});
            }
        });
    }

    if (interaction.commandName === "remove") {
        const member = interaction.options.getMember("member");
        console.log(`Checking if ${member.user.username} is in the queue.`);
        await interaction.reply(`Checking if ${member.user.username} is in the queue.`);
        FileSystem.readFile("./users.json", (err, data) => {
            if (err) console.log(err);
            try {
                var userarray = JSON.parse(data);
                if (!Array.isArray(userarray)) {
                    throw new Error("Invalid data in users.json");
                }
            } catch (error) {
                console.error("Failed to parse users.json, halting");
                process.exit(1);
            }
            //reverse the order of the queue, so that the newest is first
            userarray.reverse();
            //check if user is already registered
            if (userarray.some(e => e.id === `${member.id} Pastable: <@${member.id}>`)) {
                console.log(`${member.user.username} is in the queue. Removing.`);
                //only remove the most recent request
                userarray.splice(userarray.findIndex(e => e.id === `${member.id} Pastable: <@${member.id}>`), 1);
                userarray.reverse();
                FileSystem.writeFile("./users.json", JSON.stringify(userarray, null, 2), (err) => {
                    if (err) console.log(err);
                    interaction.editReply(`Removed ${member.user.username} from the registration queue.`);
                });
            } else {
                console.log(`${member.user.username} is not in the queue.`);
                interaction.editReply(`${member.user.username} is not in the queue.`);
            }
        });
    }
    client.user.setActivity("to user input input", { type: "LISTENING" });
});

client.login(
    token
);
