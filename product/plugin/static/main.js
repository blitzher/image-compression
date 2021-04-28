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
                let toggleModal = () => {
                    if (shadowRoot.querySelector('#modal') != null) {
                        shadowRoot.removeChild(modal);
                    } else {
                        shadowRoot.appendChild(modal);
                        shadowRoot.querySelector('#modal').focus();
                    }
                };

                // Open/close modal (Add or remove).
                toggle.addEventListener('click', () => {
                    toggleModal();
                });

                document.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Escape') {
                        toggleModal();
                    }

                    document.removeEventListener('keydown', () => {});
                });

                templateClone
                    .getElementById('cancelModal')
                    .addEventListener('click', () => toggleModal());

                const uploadField = document.getElementById('imageUpload');
                // const imagePreview = templateClone.getElementById(
                //     'imagePreview',
                // );
                const canvas = templateClone.getElementById('imagePreview');

                function grayscale(canvas) {
                    const ctx = canvas.getContext('2d');
                    const imageData = ctx.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height,
                    );

                    for (let i = 0; i < imageData.data.length; i += 4) {
                        let avg =
                            (imageData.data[i] +
                                imageData.data[i + 1] +
                                imageData.data[i + 2]) /
                            3;

                        imageData.data[i] = avg;
                        imageData.data[i + 1] = avg;
                        imageData.data[i + 2] = avg;
                    }

                    ctx.putImageData(imageData, 0, 0);
                    console.log("grey")
                }

                let presetOptions = templateClone.getElementById('compSelect');
                const qualityConfig = {
                    preset: "default"
                }

                const image = new Image();

                const optionsWrapper = templateClone.querySelector('[class="options-wrapper"]');

                presetOptions.addEventListener('change', (ev) => {
                    let value = ev.target.value;
                    qualityConfig.preset = value;
                    console.log(qualityConfig.preset);
                    ev.preventDefault();

                    switch (qualityConfig.preset) {
                        case "grayscale":
                            grayscale(canvas);
                            optionsWrapper.style.width = 0;
                            break;
                        case "custom":
                            optionsWrapper.style.width = "100%";
                            break;
                        default:
                            {
                                let ctx = canvas.getContext("2d");
                                ctx.drawImage(image, 0, 0);
                                optionsWrapper.style.width = 0;
                            }
                            break;
                    }
                });

                uploadField.removeEventListener('change', () => {});
                uploadField.addEventListener('change', () => {
                    const file = uploadField.files[0];
                    /* 2^10 = 1024,
					   2^20 = 2^10 * 2^10 = ~1000 * ~1000 ~= 1.000.000*/
                    const fileSize =
                        file.size / Math.pow(2, 20); /* Get file size in MB */
                    if (fileSize >= 0) {
                        toggleModal();

                        const ctx = canvas.getContext('2d');

                        image.onload = () => {
                            canvas.width = image.width;
                            canvas.height = image.height;
                            ctx.drawImage(image, 0, 0);
                        };

                        image.crossOrigin = 'anonymous';
                        image.src = window.URL.createObjectURL(file);
                    } else {
                        /* send the image */
                    }
                });
                //const upfile = templateClone.getElementById('upfile');
                //const preview = templateClone.getElementById('imageUpload');
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
