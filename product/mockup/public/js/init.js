/* init.js */

/* Helpers */
export const $ = (id) => document.getElementById(id);
export const _f = document.forms;

/**
 * Private bubble element to display messages in chat.
 * @param {String} text
 * @param {String} time
 * @param {String} user
 * @returns
 */
const bubbleElem = (text, time, user) => {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    bubble.innerHTML = `
	<p class="bubble__user">${user ? user + ' says:' : ''}</p>
	<p class="bubble__body">${text}</p>
	<p class="bubble__time">${time}</p>`;

    return bubble;
};

/**
 * Format and send message to server.
 * @param {Object} session
 * @param {String} contentType
 * @param {String} imageSrc
 * @returns
 */
export const sendMsg = (session, contentType, imageSrc) => {
    let msg = msgForm.elements.msgInput.value.trim();

    if (msg === '' && !imageSrc) return;

    //Get time in milliseconds
    const sendTime = new Date().getTime();

    let payload =
        contentType === 'image'
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

    msgForm.elements.msgInput.value = '';
};

/**
 * Append a message to chatbox, as if it was received
 * @param {Object} msg
 * @param {Boolean} toneEnabled
 */
export const receivedMsg = (msg, toneEnabled) => {
    let chatbox = document.getElementById('chatbox');

    // Time object from timestamp (milliseconds)
    const timestamp = new Date(msg.timestamp);

    /**
     * Format time such as 21:05
     * or 9:05 PM
     */

    /* FOR FUTURE CONFIGS / SETTINGS */
    const american_time = true;

    let formattedTime;
    if (american_time) {
        let hours = timestamp.getHours();
        let minutes = timestamp.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        formattedTime = hours + ':' + minutes + ' ' + ampm;
    } else {
        const hours = timestamp.getHours().toString();
        const minutes = timestamp.getMinutes().toString().padStart(2, '0');
        formattedTime = `${hours}:${minutes}`;
    }

    let bubble = bubbleElem(msg.body, formattedTime, msg.displayName);

    if (msg.contentType === 'image') {
        let image = document.createElement('img');
        image.src = msg.imageSrc;
        bubble.appendChild(image);
    }

    if (msg.displayName === sessionStorage.getItem('displayName')) {
        bubble.classList.add('bubble--my');
    }

    if (
        toneEnabled &&
        msg.displayName !== sessionStorage.getItem('displayName')
    ) {
        const audio = new Audio(`tone.mp3`);
        audio.volume = $('volume').value / 100;
        audio.play();
    }

    chatbox.appendChild(bubble);
    chatbox.parentElement.scrollTo(0, chatbox.parentElement.scrollHeight);
};

/**
 * Application entrypoint.
 * @param {String} host Host name
 * @returns
 */
export const init = (host) => {
    let clientSession = {
        displayName: sessionStorage.getItem('displayName'),
        socket: new WebSocket(`ws://${host}`),
    };

    /* Get message history from server */
    fetch(window.location + 'api/get_message_history')
        .then((response) => response.json())
        .then((data) => {
            clientSession['msgHistory'] = data;
            data.forEach((msg) => {
                receivedMsg(msg, false);
            });
        });

    $('currentUser').innerText = 'User: ' + clientSession.displayName;

    return clientSession;
};

/**
 * Verify extension of uploaded image file.
 * @param {String} filename
 * @returns
 */
function fileValidation(filename) {
    // Allowing file type
    var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.webp)$/i;

    if (!allowedExtensions.exec(filename)) {
        alert('Invalid file type');
        return false;
    } else {
        return true;
    }
}

/**
 * Image upload handler.
 * @param {String} host
 * @param {Object} session
 * @returns
 */
export const sendImage = (host, session) => {
    let xhr = new XMLHttpRequest();
    let file = $('imageUpload').files[0];

    const fileSize = file.size / Math.pow(2, 20);
    if (fileSize > 5) {
        $('imageUpload').value = null; //does not work
        //alert('Filesize exceeds file limit');
        return;
    }

    let formData = new FormData();
    formData.append('image', file);

    if (typeof file !== 'undefined' && fileValidation(file.name) == true) {
        xhr.open('POST', `/api/upload`, true);
        xhr.onload = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log('success');
            }
        };

        $('imageUpload').value = null;
        const previews = document.getElementsByClassName('image-preview');
        for (let i = previews.length - 1; i >= 0; i--) {
            previews[i].remove();
        }
        xhr.send(formData);

        sendMsg(session, 'image', `http://${host}/api/images/${file.name}`);
    }
};
