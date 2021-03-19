const WebSocket = require("ws");
const express = require('express');
const fileUpload = require("express-fileupload");
const favicon = require('serve-favicon');
const app = express();
const expressWs = require('express-ws')(app);

const port = 8989;

app.use(fileUpload());
app.use(express.json());
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use('/', express.static(__dirname + '/public'));
var wss = expressWs.getWss('/');

const messageHistory = [
    {
        displayName: "Cool Server😎",
        body: "🍔"
    }
];

app.ws('/', (ws, req) => {
    //ws.send('{"displayName": "", "body": "Hello, Client!"}');

    ws.on('message', (message) => {
        
        wss.clients.forEach( (client) => {
            client.send(message);
        });
        
        messageHistory.push(JSON.parse(message))
        
    });
});

app.get('/api/get_message_history/', (req, res) => {
    res.send(messageHistory)
})

app.post("/api/send_image", (req, res) => {
    console.log(req);
})


app.listen(port, () => {
    console.log(`server listening on ${port}`);
});