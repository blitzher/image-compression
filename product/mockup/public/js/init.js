/* init.js */

export const $ = i => document.getElementById(i);

/* private */
const bubbleElem = ( text, time, user ) => {
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";

	bubble.innerHTML = `
	<p class="bubble-body">${text}</p>
	<p class="bubble-time">${time}</p>
	<p class="bubble-user">${user ? user + ", says:" : ""}</p>`;
	
	return bubble;
}

export const sendMsg = ( session, contentType, imageSrc ) => {
	let msg = msgForm.elements.msgInput.value;

	if ( msg != "" ) {

        session.socket.send(JSON.stringify({
            displayName: session.displayName,
            body: msgForm.elements.msgInput.value,
			contentType: contentType,
			imageSrc: imageSrc
        }));

        msgForm.elements.msgInput.value = "";
    }
};

/* append a message to chatbox, as if it was received */
export const receivedMsg = (msg) => {
    let chatbox = $("chatbox");
    let bubble = bubbleElem(msg.body, `${date.getHours()}:${date.getMinutes()}`, msg.displayName);

	if (msg.contentType === "image") {
		let image = document.createElement("img");
		image.src = msg.imageSrc;
		bubble.appendChild(image);
	}

    if (msg.displayName === sessionStorage.getItem("displayName")) {
        bubble.classList.add("msg-bubble-my");
    }

    chatbox.appendChild(bubble);
    chatbox.parentElement.scrollTo(0, chatbox.parentElement.scrollHeight)
};

export const init = ( host ) => {
	let clientSession = {
		displayName: sessionStorage.getItem("displayName"),
		socket: new WebSocket(`ws://${host}`)
	};

	/* get message history from server */
	fetch(window.location + 'api/get_message_history')
		.then( response => response.json() )
		.then( data => {
			clientSession["msgHistory"] = data;
			data.forEach( msg => {
				receivedMsg(msg);
			});
		});

	$("currentUser").innerText = "User: " + clientSession.displayName;

	return clientSession;
};

export const sendImage = ( host, session ) => {
	let xhr = new XMLHttpRequest();
	let file = $("imageUpload").files[0]
	let formData = new FormData();
	formData.append("image", file);

	console.log(file.name)
	console.log(`${host}/api/upload`)

	xhr.open("POST", `/api/upload`, true);
	xhr.onload = () => {
		if ( xhr.readyState === 4 && xhr.status === 200 ) {
			console.log("something")
		}
	}
	
	xhr.send(formData);

	sendMsg(session, "image", `http://${host}/api/images/${file.name}`);
}