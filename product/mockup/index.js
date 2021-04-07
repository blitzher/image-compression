const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const expressWs = require('express-ws')(app);
const fs = require('fs');

const port = process.argv[2];

if (!fs.existsSync('uploads') || !fs.statSync('uploads').isDirectory()) {
    fs.mkdirSync('uploads');
}

app.use(fileUpload());
app.use(express.json());
app.use('/', express.static(__dirname + '/public')); // Serves client-side files.
app.use('/plugin', express.static(__dirname + '/../plugin/static')); // Serves the plugin on a seperate route.
app.use('/api/images', express.static(__dirname + '/uploads')); // Serves uploaded images.
let wss = expressWs.getWss('/');

// Semi persistent message history for new connections
const messageHistory = [
    {
        displayName: 'Cool Server😎',
        timestamp: new Date().getTime(),
        body: '🍔🍔',
    },
];

// Primary communications socket.
app.ws('/', (ws, req) => {
    ws.on('message', (message) => {
        console.log(message);

        const msg = JSON.parse(message);
        wss.clients.forEach((client) => {
            if (msg.body === ';clear') {
                client.send(';clear');
                messageHistory.splice(1, messageHistory.length);
                client.send(JSON.stringify(messageHistory[0]));
            } else {
                client.send(message);
            }
        });

        if (msg !== ';clear') messageHistory.push(JSON.parse(message));
    });
});

// Route: Message message history.
app.get('/api/get_message_history/', (req, res) => {
    res.send(messageHistory);
});

// Route: Image uploads.
app.post('/api/upload', (req, res) => {
    let file;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    file = req.files.image;
    uploadPath = __dirname + '/uploads/' + file.name;

    file.mv(uploadPath, (err) => {
        if (err) return res.status(500).send(err);

        res.send(`/uploads/${file.name}`);
    });
});

app.listen(port, () => {
    console.log(`server listening on ${port}`);
});
