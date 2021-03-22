const WebSocket = require("ws");
const express = require('express');
const fileUpload = require("express-fileupload");
const app = express();
const expressWs = require('express-ws')(app);
const fs = require("fs");

const port = 8989;

if (!fs.existsSync("uploads") || !fs.statSync("uploads").isDirectory()) {
    fs.mkdirSync("uploads");
}

app.use(fileUpload());
app.use(express.json());
app.use('/', express.static(__dirname + '/public'));
app.use("/api/images", express.static(__dirname + "/uploads"))
var wss = expressWs.getWss('/');

const messageHistory = [{
    displayName: "Cool Server😎",
    timestamp: new Date().getTime(),
    body: "🍔"
}];

app.ws('/', (ws, req) => {
    //ws.send('{"displayName": "", "body": "Hello, Client!"}');

    ws.on('message', (message) => {
        console.log(message);

        wss.clients.forEach((client) => {
            client.send(message);
        });

        messageHistory.push(JSON.parse(message))
    });

});

app.get('/api/get_message_history/', (req, res) => {
    res.send(messageHistory)
})

app.post("/api/upload", (req, res) => {
    let file;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
    }

    file = req.files.image;
    uploadPath = __dirname + "/uploads/" + file.name;

    file.mv(uploadPath, (err) => {
        if (err) return res.status(500).send(err);

        res.send(`/uploads/${file.name}`);
    })
});


app.listen(port, () => {
    console.log(`server listening on ${port}`);
});