import * as Util from "./init.js";

/* const $ = (i) => document.getElementById(i) */



/* get form elements from document */
let msgForm = document.forms.msgForm;
let setDisplayNameForm = document.forms.setDisplayNameForm;

/* unhide displayNameForm when displayName is not set */
if (Util.clientSession.displayName === null) document.getElementById("setName").style.display = "flex";

Util.clientSession.socket.addEventListener("connect", () => {
    socket.send(JSON.stringify({
        displayName: sessionStorage.getItem("displayName"),
        body: "Hello, server!"
    }));

    socket.send();
});

Util.clientSession.socket.addEventListener("message", e => {
    Util.receivedMsg(JSON.parse(e.data));
});

msgForm.addEventListener("submit", e => {
    e.preventDefault();
    Util.sendMsg();

    let images = document.getElementById("imageUpload").files;
    if (images.length > 0) {
        Util.clientSession.sendImage(images.files[0]);
    }

    console.log(sessionStorage.getItem("displayName"));
});

/* when the display name has just been set */
setDisplayNameForm.addEventListener("submit", e => {
    e.preventDefault();
    Util.clientSession.displayName = setDisplayNameForm.setDisplayName.value;
    sessionStorage.setItem("displayName", Util.clientSession.displayName);
    document.getElementById("setName").style.display = "none";
    document.getElementById("currentUser").innerText = "User: " + Util.clientSession.displayName;
})

Util.clientSession.socket.addEventListener("error", () => {
    location.reload();
})

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