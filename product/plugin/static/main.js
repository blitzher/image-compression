
const define = (html) => {
    class MyComponent extends HTMLElement {
        constructor() {
            super();

            this.getConfig = () => JSON.parse(this.getAttribute("config"));

            this.logConfig = () => console.log(this.getConfig().something);

            const shadowRoot = this.attachShadow({mode: "open"});

            let wrapper = document.createElement("div");
            wrapper.innerHTML = html;

            let template = wrapper.firstChild;

            shadowRoot.appendChild(template.content.cloneNode(true));
        }
    }

    customElements.define("custom-tag", MyComponent);
};

fetch("template.html")
    .then(stream => stream.text())
    .then(text => define(text));
