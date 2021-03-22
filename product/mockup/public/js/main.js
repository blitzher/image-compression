import * as Util from "./init.js";

/* const $ = (i) => document.getElementById(i) */

const clientSession = Util.init();

/* get form elements from document */
let msgForm = document.forms.msgForm;
let setDisplayNameForm = document.forms.setDisplayNameForm;

/* unhide displayNameForm when displayName is not set */
if (clientSession.displayName === null) {
    let modal = document.getElementById("setName");
    modal.style.display = "flex";
}

Util.socket.addEventListener("connect", () => {
    socket.send(JSON.stringify({
        displayName: sessionStorage.getItem("displayName"),
        body: "Hello, server!"
    }));

    socket.send();
});

Util.socket.addEventListener("message", e => {
    Util.receivedMsg(JSON.parse(e.data));
});

msgForm.addEventListener("submit", e => {
    e.preventDefault();
    Util.sendMsg();

    let image = document.getElementById("imageUpload");
    if (image.value !== null) {
        Util.sendImage(image.files[0]);
    }
    image.value = null;

    console.log(sessionStorage.getItem("displayName"));
});

/* when the display name has just been set */
setDisplayNameForm.addEventListener("submit", e => {
    e.preventDefault();
    clientSession.displayName = setDisplayNameForm.setDisplayName.value;
    sessionStorage.setItem("displayName", clientSession.displayName);
    document.getElementById("setName").style.display = "none";
    document.getElementById("currentUser").innerText = "User: " + clientSession.displayName;
})

Util.socket.addEventListener("error", () => {
    location.reload();
})

/* 
setTimeout( () => {
	location.reload();
},	1000);
 */


const previewImage = (file) => {
    if (typeof imageUpload.files[0] !== "undefined") {
        let preview = document.createElement("img");
        preview.src = URL.createObjectURL(file);
        preview.className = "image-preview";

        let chatbox = document.getElementById("msgForm");
        chatbox.prepend(preview);

        console.log(file.name)
    }
}

const imageUpload = document.getElementById("imageUpload");
imageUpload.addEventListener("change", () => previewImage(imageUpload.files[0]));