/* init.js */

export const $ = (id) => document.getElementById(id);
export const _f = document.forms;

/* private */
const bubbleElem = (text, time, user) => {
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  bubble.innerHTML = `
	<p class="bubble-user">${user ? user + " says:" : ""}</p>
	<p class="bubble-body">${text}</p>
	<p class="bubble-time">${time}</p>`;

  return bubble;
};

export const sendMsg = (session, contentType, imageSrc) => {
  let msg = msgForm.elements.msgInput.value.trim();

  if (msg === "" && !imageSrc) return;

  const sendTime = new Date().getTime();

  let payload =
    contentType === "image"
      ? {
          displayName: session.displayName,
          body: msgForm.elements.msgInput.value,
          contentType: contentType,
          imageSrc: imageSrc,
          timestamp: sendTime,
        }
      : {
          displayName: session.displayName,
          body: msgForm.elements.msgInput.value,
          contentType: contentType,
          timestamp: sendTime,
        };

  session.socket.send(JSON.stringify(payload));

  msgForm.elements.msgInput.value = "";
};

/* append a message to chatbox, as if it was received */
export const receivedMsg = (msg, tone) => {
  let chatbox = document.getElementById("chatbox");

  const timestamp = new Date(msg.timestamp);

  /**
   * format such as 21:05
   * or 9:05 PM
   */

  /* FOR FUTURE CONFIGS / SETTINGS */
  const american_time = true;

  let formattedTime;
  if (american_time) {
    let hours = timestamp.getHours();
    let minutes = timestamp.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    formattedTime = hours + ":" + minutes + " " + ampm;
  } else {
    const hours = timestamp.getHours().toString();
    const minutes = timestamp.getMinutes().toString().padStart(2, "0");
    formattedTime = `${hours}:${minutes}`;
  }

  let bubble = bubbleElem(msg.body, formattedTime, msg.displayName);

  if (msg.contentType === "image") {
    let image = document.createElement("img");
    image.src = msg.imageSrc;
    bubble.appendChild(image);
  }

  if (msg.displayName === sessionStorage.getItem("displayName")) {
    bubble.classList.add("msg-bubble-my");
  }

  if (tone && msg.displayName !== sessionStorage.getItem("displayName")) {
    const audio = new Audio(`tone.mp3`);
    audio.volume = $("volume").value / 100;
    audio.play();
  }

  chatbox.appendChild(bubble);
  chatbox.parentElement.scrollTo(0, chatbox.parentElement.scrollHeight);
};

export const init = (host) => {
  let clientSession = {
    displayName: sessionStorage.getItem("displayName"),
    socket: new WebSocket(`ws://${host}`),
  };

  /* get message history from server */
  fetch(window.location + "api/get_message_history")
    .then((response) => response.json())
    .then((data) => {
      clientSession["msgHistory"] = data;
      data.forEach((msg) => {
        receivedMsg(msg, false);
      });
    });

  $("currentUser").innerText = "User: " + clientSession.displayName;

  return clientSession;
};

function fileValidation(file) {    
  // Allowing file type
  var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
  
  if (!allowedExtensions.exec(file)) {
    alert('Invalid file type');
    return false;
  }else{
    return true;
  }
}

export const sendImage = (host, session) => {
  let xhr = new XMLHttpRequest();
  let file = $("imageUpload").files[0];

  const fileSize = file.size / Math.pow(2, 20);
  if (fileSize > 5) {
    $("imageUpload").value = null; //does not work
    alert("Filesize exceeds file limit");
    return;
  }

  let formData = new FormData();
  formData.append("image", file);

  if (typeof file !== "undefined" && fileValidation(file.name) == true) {
    xhr.open("POST", `/api/upload`, true);
    xhr.onload = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        console.log("success");
      }
    };

    $("imageUpload").value = null;
    const previews = document.getElementsByClassName("image-preview");
    for (let i = previews.length - 1; i >= 0; i--) {
      previews[i].remove();
    }
    xhr.send(formData);

    sendMsg(session, "image", `http://${host}/api/images/${file.name}`);
  }
};
