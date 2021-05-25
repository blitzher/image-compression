const hello = 'hiiii';

function grayscale(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

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
    console.log('grey');
}

const initPlugin = (config) => {
    const define = (html) => {
        class MyComponent extends HTMLElement {
            constructor() {
                super();


                function applyCustomStyle(root, customStyleObject) {
                    const selectors = Object.keys(customStyleObject);

                    for (let selector of selectors) {
                        const selectorStyle = customStyleObject[selector];
                        let formattedStyle = '';
                        for (let [key, val] of Object.entries(selectorStyle)) {
                            formattedStyle += `${key}:${val};`;
                        }

                        root.querySelector(selector).style.cssText +=
                            formattedStyle;
                    }
                }

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
                        applyCustomStyle(shadowRoot, config.style);
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

                    document.removeEventListener('keydown', () => { });
                });

                templateClone
                    .getElementById('cancelModal')
                    .addEventListener('click', () => toggleModal());

                const uploadField = document.getElementById('imageUpload');
                // const imagePreview = templateClone.getElementById(
                //     'imagePreview',
                // );
                const canvas = templateClone.getElementById('imagePreview');
                const sendBtn = templateClone.getElementById('send-image');

                let payload = {};

                let transcoder = jpeg();

                let samplingModePickers = templateClone
                    .getElementById('custom-preset-settings')
                    .querySelectorAll('[type="radio"]');


                sendBtn.addEventListener('click', () => {
                    config.onSend(payload);

                    transcoder.close();
                    toggleModal();
                });

                let presetOptions = templateClone.getElementById('compSelect');
                const qualityConfig = {
                    preset: 'default',
                };

                const image = new Image();

                const optionsWrapper = templateClone.querySelector(
                    '[class="options-wrapper"]',
                );

                //let ctx = canvas.getContext("2d");
                const lum_slider = templateClone.getElementById("lum-qual");
                const chrom_slider = templateClone.getElementById("chrom-qual");
                const compressBtn = templateClone.getElementById('compress');
                compressBtn.addEventListener('click', (ev) => {
                    let selectedSampling;
                    samplingModePickers.forEach((b, i) => { if (b.checked) selectedSampling = i });
                    const sampling = [[4, 4, 4], [4, 2, 2], [4, 1, 1]][selectedSampling];
                    const lum_qual = Number.parseInt(lum_slider.value)
                    const chrom_qual = Number.parseInt(chrom_slider.value)

                    let qual_set = [
                        lum_qual,
                        chrom_qual,
                        sampling,]

                    encodeAndDisplay(qual_set, "custom");
                });

                presetOptions.addEventListener('change', (ev) => {
                    let value = ev.target.value;
                    qualityConfig.preset = value;
                    console.log(qualityConfig.preset);
                    ev.preventDefault();




                    let encode_form, name;
                    switch (qualityConfig.preset) {
                        case 'high':
                            {
                                encode_form = [100, 50, [4, 4, 4]];
                                name = 'default';
                                optionsWrapper.style.width = 0;
                            }
                            break;
                        case 'medium':
                            {
                                encode_form = [100, 100, [4, 2, 2]];
                                name = 'default';
                                optionsWrapper.style.width = 0;
                            }
                            break;
                        case 'low':
                            {

                                encode_form = [50, 25, [4, 2, 0]];
                                name = 'low';
                                optionsWrapper.style.width = 0;
                            }
                            break;
                        case 'custom':
                            {

                                optionsWrapper.style.width = '100%';
                                encode_form = [10, 10, [4, 4, 1]];
                                name = 'custom';
                            }
                            break;
                        default:
                            {
                                optionsWrapper.style.width = 0;
                                encode_form = [100, 100, [4, 2, 0]];
                                name = 'default';
                            }
                            break;
                    }
                    encodeAndDisplay(encode_form, name)
                });

                function encodeAndDisplay(settings, name) {
                    let fileUrl = window.URL.createObjectURL(
                        uploadField.files[0],
                    );
                    transcoder.encode(fileUrl, ...settings).then(enc => {
                        console.log(`Done! Preset: ${name}`);
                        transcoder.decode(enc, canvas);

                    })
                }

                uploadField.removeEventListener('change', () => { });
                uploadField.addEventListener('change', () => {
                    const file = uploadField.files[0];
                    let fileUrl = window.URL.createObjectURL(file);
                    /* 2^10 = 1024,
                       2^20 = 2^10 * 2^10 = ~1000 * ~1000 ~= 1.000.000*/
                    const fileSize =
                        file.size / Math.pow(2, 20); /* Get file size in MB */
                    if (fileSize >= 0) {
                        toggleModal();

                        //const ctx = canvas.getContext('2d');
                        //const gpu = new GPU({ canvas });

                        image.onload = () => {
                            canvas.width = image.width;
                            canvas.height = image.height;

                            transcoder
                                .encode(fileUrl, 100, 100, [4, 2, 1])
                                .then((x) => {
                                    transcoder.decode(x, canvas);

                                    payload = x;
                                });
                            optionsWrapper.style.width = 0;
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
