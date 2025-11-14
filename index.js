const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// CONFIG
const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://discord.com/api/webhooks/XXX/YYY";
const OFFLINE_TIMEOUT = 20; // detik

let bots = {}; // menyimpan status semua bot

// -----------------------
// SEND WEBHOOK
// -----------------------
async function sendWebhook(embed) {
    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
    } catch (err) {
        console.log("Webhook error:", err.message);
    }
}

// -----------------------
// HEARTBEAT ROUTE
// -----------------------
app.post("/heartbeat", (req, res) => {
    const { username, userid } = req.body;
    const now = Date.now() / 1000;

    if (!bots[userid]) {
        bots[userid] = {
            username,
            last: now,
            online: false,
        };
    }

    bots[userid].last = now;

    if (!bots[userid].online) {
        bots[userid].online = true;

        sendWebhook({
            title: "NOTIFIER",
            description: `${username} - ONLINE ✅`,
            color: 0x00ff00,
            footer: { text: "Heartbeat System" }
        });
    }

    return res.send("OK");
});

// -----------------------
// OFFLINE CHECK LOOP
// -----------------------
setInterval(() => {
    const now = Date.now() / 1000;

    for (const id in bots) {
        const bot = bots[id];

        if (bot.online && now - bot.last > OFFLINE_TIMEOUT) {
            bot.online = false;

            sendWebhook({
                title: "NOTIFIER",
                description: `${bot.username} - OFFLINE ❌`,
                color: 0xff0000,
                footer: { text: "Heartbeat System" }
            });
        }
    }
}, 3000);

// -----------------------
// DASHBOARD
// -----------------------
app.get("/", (req, res) => {
    let html = `
    <html>
    <head>
        <title>Heartbeat Dashboard</title>
        <meta http-equiv="refresh" content="5" />
        <style>
            body { font-family: Arial; background: #111; color: #fff; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; border-bottom: 1px solid #444; }
            .online { color: #00ff00; font-weight: bold; }
            .offline { color: #ff4444; font-weight: bold; }
            h1 { text-align: center; }
        </style>
    </head>
    <body>
        <h1>Heartbeat Dashboard</h1>
        <table>
            <tr>
                <th>Username</th>
                <th>UserID</th>
                <th>Status</th>
                <th>Last Update</th>
            </tr>
    `;

    const now = Date.now() / 1000;

    for (const id in bots) {
        const bot = bots[id];
        const className = bot.online ? "online" : "offline";
        const last = Math.floor(now - bot.last);

        html += `
        <tr>
            <td>${bot.username}</td>
            <td>${id}</td>
            <td class="${className}">${bot.online ? "Online" : "Offline"}</td>
            <td>${last} detik lalu</td>
        </tr>`;
    }

    html += `
        </table>
    </body>
    </html>
    `;

    res.send(html);
});

// -----------------------
// KEEP ALIVE PING (ANTI-SLEEP)
// -----------------------
setInterval(() => {
    axios.get(`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`)
        .catch(() => {});
}, 4 * 60 * 1000); // ping setiap 4 menit

// -----------------------
app.listen(3000, () => console.log("Server berjalan di port 3000"));
