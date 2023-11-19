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
                console.error("Failed to parse users.json, initializing with an empty array");
                userarray = [];
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
                console.error("Failed to parse users.json, initializing with an empty array");
                userarray = [];
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
});

client.login(
    token
);
