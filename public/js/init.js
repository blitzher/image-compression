

const bubbleElem = ( text, time, user ) => {
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

export const socket = new WebSocket("ws://localhost:8989");

export const sendMsg = () => {
	let msg = msgForm.elements.msgInput.value            
	if ( msg != "" ) {

		socket.send(JSON.stringify({
			displayName: sessionStorage.getItem("displayName"),
			body: msgForm.elements.msgInput.value
		}));

		msgForm.elements.msgInput.value = "";
	}
};

export const receivedMsg = ( msg ) => {
	let chatbox = document.getElementById("chatbox");

	let bubble = bubbleElem( msg.body, `${date.getHours()}:${date.getMinutes()}`, msg.displayName );

	if (msg.displayName === sessionStorage.getItem("displayName")) {
		bubble.classList.add("msg-bubble-my");
		
	}
	
	chatbox.appendChild(bubble);
	chatbox.parentElement.scrollTo( 0, chatbox.parentElement.scrollHeight )
};

export const init = () => {
	let clientSession = {
		displayName: sessionStorage.getItem("displayName")
	};

	/* get message history from server */
	fetch(window.location + 'api/get_message_history')
		.then( response => response.json() )
		.then( data => {
			clientSession["msgHistory"] = data;
			data.forEach( msg => {
				receivedMsg(msg);
			})
		});

	document.getElementById("currentUser").innerText = "User: " + clientSession.displayName;

	return clientSession;
};

export const sendImage = (file) => {
	const reader = new FileReader();
	const xhr = new XMLHttpRequest();

	xhr.open("POST", "http://localhost:8989/api/send_image");
	xhr.overrideMimeType("image/jpeg; charset=x-user-defined-binary");
	reader.onload = e => {
		xhr.send(e.target.result);
	};
	reader.readAsBinaryString(file);
}