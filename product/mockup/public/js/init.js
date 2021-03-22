/* private */
const bubbleElem = (text, time, user) => {
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";

    const bubbleBody = document.createElement("p");
    bubbleBody.innerText = text;
    bubbleBody.className = "bubble-body";

    const bubbleTime = document.createElement("p");
    bubbleTime.innerText = time;
    bubbleTime.className = "bubble-time";

    const bubbleUser = document.createElement("p");
    bubbleUser.innerText = user ? user + ", says:" : "";
    bubbleUser.className = "bubble-user";


    bubble.appendChild(bubbleUser);
    bubble.appendChild(bubbleBody);
    bubble.appendChild(bubbleTime);

    return bubble;
}

export const sendMsg = () => {
    let msg = msgForm.elements.msgInput.value.trim();



    if (msg != "") {

        const sendTime = new Date().getTime();

        /* send the message to the server, with the current time as timestamp */
        clientSession.socket.send(JSON.stringify({
            displayName: sessionStorage.getItem("displayName"),
            timestamp: sendTime,
            body: msgForm.elements.msgInput.value
        }));

        msgForm.elements.msgInput.value = "";
    }
};

/* append a message to chatbox, as if it was received */


export const receivedMsg = (msg) => {
    let chatbox = document.getElementById("chatbox");
    /* ?? why is this here ?? */
    console.log(msg);
    const timestamp = new Date(msg.timestamp)

    /**
     * format such as 21:05
     * or 9:05 PM
     */

    /* FOR FUTURE CONFIGS / SETTINGS */
    const american_time = true;

    let formattedTime;
    if (american_time) {
        let hours = timestamp.getHours();
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = (hours % 12) || 12;
        formattedTime = hours + ':' + minutes + ' ' + ampm;
    } else {
        const hours = timestamp.getHours().toString();
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        formattedTime = `${hours}:${minutes}`;
    }

    let bubble = bubbleElem(msg.body, formattedTime, msg.displayName);

    if (msg.displayName === sessionStorage.getItem("displayName")) {
        bubble.classList.add("msg-bubble-my");
    }

    chatbox.appendChild(bubble);
    chatbox.parentElement.scrollTo(0, chatbox.parentElement.scrollHeight)
};

export const init = (host) => {
    let clientSession = {
        displayName: sessionStorage.getItem("displayName"),
        socket: new WebSocket(`ws://${host}`)
    };

    /* get message history from server */
    fetch(window.location + 'api/get_message_history')
        .then(response => response.json())
        .then(data => {
            clientSession["msgHistory"] = data;
            data.forEach(msg => {
                receivedMsg(msg);
            });
        });

    document.getElementById("currentUser").innerText = "User: " + clientSession.displayName;

    return clientSession;
};

/* export const sendImage = (file) => {
    const reader = new FileReader();
    const xhr = new XMLHttpRequest();

    xhr.open("POST", "http://localhost:8989/api/send_image");
    xhr.overrideMimeType("image/jpeg; charset=x-user-defined-binary");
    reader.onload = e => {
        xhr.send(e.target.result);
    };
    reader.readAsBinaryString(file);
} */

export const clientSession = init(window.location.host);