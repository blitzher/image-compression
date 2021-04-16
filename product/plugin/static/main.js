const initPlugin = (config) => {
    const define = (html) => {
        class MyComponent extends HTMLElement {
            constructor() {
                super();

                const shadowRoot = this.attachShadow({ mode: 'open' });

                // Temporary wrapper element to extract fetched template.
                let tempElem = document.createElement('div');
                tempElem.innerHTML = html;

                let templateClone = tempElem.firstChild.content.cloneNode(true);

                // Get the elements we want.
                let modal = templateClone.getElementById('modal');
                let toggle = templateClone.getElementById('toggle');

                // Append toggle button to DOM.
                shadowRoot.appendChild(toggle);
                let removeModal = () => {
                    if (shadowRoot.querySelector('#modal') != null) {
                        shadowRoot.removeChild(modal);
                    } else {
                        shadowRoot.appendChild(modal);
                        shadowRoot.querySelector('#modal').focus();
                    }
                };

                // Open/close modal (Add or remove).
                toggle.addEventListener('click', () => {
                    removeModal();
                });

                document.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Escape') {
                        removeModal();
                    }

                    document.removeEventListener('keydown', () => {});
                });
                const upfile = templateClone.getElementById('upfile');
                const preview = templateClone.getElementById('preview');
                upfile.addEventListener('change', () => {
                    preview.src = window.URL.createObjectURL(upfile.files[0]);
                });
            }
        }

        customElements.define('plugin-modal', MyComponent);
    };

    fetch('plugin/plugin.html')
        .then((stream) => stream.text())
        .then((text) => {
            define(text);
        });

    return config;
};
