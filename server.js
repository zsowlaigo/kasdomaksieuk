// ===============================================
// HEARTBEAT SERVER (MULTI ACCOUNT + DASHBOARD)
// Compatible with Railway.app
// ===============================================

const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ------------------------
// KONFIGURASI
// ------------------------
const WEBHOOK_URL = "https://discord.com/api/webhooks/1438931311241990237/wttVNOGEAJ3iGjaji_JuurHCcQbq-3PSt98kJ_9pBqyINxn3B67SGjwPpUUnuuwB5sqC";
const OFFLINE_TIMEOUT = 20; // detik tanpa heartbeat
const PORT = process.env.PORT || 3000;

// Simpan status semua bot
let bots = {};

// ------------------------
// KIRIM PESAN WEBHOOK
// ------------------------
async function sendWebhook(embed) {
    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
    } catch (err) {
        console.log("Webhook Error:", err.message);
    }
}

// ------------------------
// ROUTE HEARTBEAT
// ------------------------
app.post("/heartbeat", (req, res) => {
    const { username, userid, time } = req.body;
    const now = Date.now() / 1000;

    if (!bots[userid]) {
        bots[userid] = {
            username: username,
            last: now,
            online: false,
        };
    }

    bots[userid].last = now;

    if (!bots[userid].online) {
        bots[userid].online = true;

        sendWebhook({
            title: "WAYAYEEEE NOTIFIER",
            description: `${username} - ONLINE ✅`,
            color: 0x00ff00,
            footer: { text: "Heartbeat System" }
        });
    }

    res.send("OK");
});

// ------------------------
// CEK BOT OFFLINE
// ------------------------
setInterval(() => {
    const now = Date.now() / 1000;

    for (const id in bots) {
        const bot = bots[id];

        if (bot.online && now - bot.last > OFFLINE_TIMEOUT) {
            bot.online = false;

            sendWebhook({
                title: "WAYAYEEEE NOTIFIER",
                description: `${bot.username} - DISCONNECT ❌`,
                color: 0xff0000,
                footer: { text: "Heartbeat System" }
            });
        }
    }
}, 3000);

// ------------------------
// DASHBOARD
// ------------------------
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
                <th>USERNAME</th>
                <th>USER ID</th>
                <th>STATUS</th>
                <th>LAST UPDATE</th>
            </tr>
    `;

    const now = Date.now() / 1000;

    for (const id in bots) {
        const bot = bots[id];
        const status = bot.online ? "Online" : "Offline";
        const className = bot.online ? "online" : "offline";
        const last = Math.floor(now - bot.last);

        html += `
        <tr>
            <td>${bot.username}</td>
            <td>${id}</td>
            <td class="${className}">${status}</td>
            <td>${last}s ago</td>
        </tr>
        `;
    }

    html += `
        </table>
    </body>
    </html>
    `;

    res.send(html);
});

// ------------------------
// START SERVER
// ------------------------
app.listen(PORT, () => {
    console.log("Server berjalan di port " + PORT);
});
