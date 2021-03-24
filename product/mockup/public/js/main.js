import * as Util from "./init.js";
import { $, _f } from "./init.js";

(() => {
    // Init application
    let client = Util.init(window.location.host);

    /* get form elements from document */
    let msgForm = _f.msgForm;
    let setDisplayNameForm = _f.setDisplayNameForm;

    /* unhide displayNameForm when displayName is not set */
    if (client.displayName === null) {
        $("setName").style.display = "flex";
        $("displayNameInput").focus();
    }

    client.socket.addEventListener("connect", () => {
        client.socket.send(JSON.stringify({
            displayName: client.displayName,
            body: "Hello, server!"
        }));

        client.socket.send(client);
    });

    client.socket.addEventListener("message", e => {
        if (e.data === ";clear")
            $("chatbox").innerHTML = "";
        else            
            Util.receivedMsg(JSON.parse(e.data), true);
    });

    msgForm.addEventListener("submit", e => {
        e.preventDefault();

        let image = $("imageUpload").files;
        if (image && image.length) {
            console.log("sending image...")
            Util.sendImage(window.location.host, client);
        } else {
            Util.sendMsg(client, "text");
        }
    });

    /* when the display name has just been set */
    setDisplayNameForm.addEventListener("submit", e => {
        e.preventDefault();
        client.displayName = setDisplayNameForm.setDisplayName.value;
        sessionStorage.setItem("displayName", client.displayName);
        $("setName").style.display = "none";
        $("currentUser").innerText = "User: " + client.displayName;
    })

    client.socket.addEventListener("error", () => {
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
    imageUpload.addEventListener("change", () => previewImage(imageUpload.files[0]))
})()