import * as Util from "./init.js";
import { $ } from "./init.js";


let clientSession = Util.init(window.location.host);

/* get form elements from document */
let msgForm = document.forms.msgForm;
let setDisplayNameForm = document.forms.setDisplayNameForm;

/* unhide displayNameForm when displayName is not set */
if (clientSession.displayName === null) {
    $("setName").style.display = "flex";
    $("displayNameInput").focus();
}

clientSession.socket.addEventListener("connect", () => {
    clientSession.socket.send(JSON.stringify({
        displayName: clientSession.displayName,
        body: "Hello, server!"
    }));

    clientSession.socket.send(clientSession);
});

clientSession.socket.addEventListener("message", e => {
    Util.receivedMsg(JSON.parse(e.data));
});

msgForm.addEventListener("submit", e => {
    e.preventDefault();

    let image = $("imageUpload").files;
    if (image.length) {
        console.log("sending image...")
        Util.sendImage(window.location.host, clientSession);
    } else {
        Util.sendMsg(clientSession, "text");
    }

    console.log(sessionStorage.getItem("displayName"));
});

/* when the display name has just been set */
setDisplayNameForm.addEventListener("submit", e => {
    e.preventDefault();
    clientSession.displayName = setDisplayNameForm.setDisplayName.value;
    sessionStorage.setItem("displayName", clientSession.displayName);
    $("setName").style.display = "none";
    $("currentUser").innerText = "User: " + clientSession.displayName;
})

clientSession.socket.addEventListener("error", () => {
    location.reload();
});

const previewImage = (file) => {
    if (typeof imageUpload.files[0] !== "undefined") {
        let preview = document.createElement("img");
        preview.src = URL.createObjectURL(file);
        preview.className = "image-preview";

        let chatbox = $("msgForm");
        chatbox.prepend(preview);
    }
}

const imageUpload = $("imageUpload");
imageUpload.addEventListener("change", () => previewImage(imageUpload.files[0]));