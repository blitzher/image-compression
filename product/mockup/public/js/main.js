import * as Util from "./init.js";


const clientSession = Util.init( window.location.host );

let msgForm = document.forms.msgForm;

let setDisplayNameForm = document.forms.setDisplayNameForm;

if (clientSession.displayName === null) document.getElementById("setName").style.display = "flex";

clientSession.socket.addEventListener("connect", () => {
	socket.send(JSON.stringify({
		displayName: sessionStorage.getItem("displayName"),
		body: "Hello, server!"
	}));

	socket.send()
})

clientSession.socket.addEventListener("message", e => {
	Util.receivedMsg(JSON.parse(e.data));
});

msgForm.addEventListener("submit", e => {
	e.preventDefault();
	Util.sendMsg();

	let image = document.getElementById("imageUpload");
	if (image.value !== null) {
		clientSession.sendImage(image.files[0]);
	}
	image.value = null;

	console.log(sessionStorage.getItem("displayName"));
});

setDisplayNameForm.addEventListener("submit", e => {
	e.preventDefault();
	sessionStorage.setItem("displayName", setDisplayNameForm.setDisplayName.value);
	document.getElementById("setName").style.display = "none";
})

clientSession.socket.addEventListener("error", () => {
	location.reload();
})

const previewImage = ( file ) => {
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
