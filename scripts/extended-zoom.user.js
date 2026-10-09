
// ==UserScript==
// @name         Agar.io Extended Zoom + Mouse 4
// @namespace    agar-extended-zoom
// @version      1.0.0
// @description  Extended map zoom + Mouse 4 as Space
// @match        https://agar.io/*
// @match        https://*.agar.io/*
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

(() => {
    'use strict';

    const page =
        typeof unsafeWindow !== 'undefined'
            ? unsafeWindow
            : window;

    /*
     * ============================================================
     * CONFIGURAÇÃO
     * ============================================================
     */

    const ZOOM_FLOOR = 0.10;

    /*
     * 1.00 = zoom normal máximo
     *
     * 0.25 = ~4x mais afastado
     * 0.10 = ~10x mais afastado
     *
     * Quanto MENOR, mais mapa você consegue enxergar.
     */


    /*
     * ============================================================
     * PATCH DO WASM
     * ============================================================
     */

    const WASM = page.WebAssembly;

    if (!WASM) {
        console.warn(
            '[Agar Extended Zoom] WebAssembly não disponível.'
        );
        return;
    }


    const originalInstantiate =
        WASM.instantiate.bind(WASM);

    const originalInstantiateStreaming =
        WASM.instantiateStreaming
            ? WASM.instantiateStreaming.bind(WASM)
            : null;


    function doubleToBytes(value) {

        const buffer =
            new ArrayBuffer(8);

        new DataView(buffer)
            .setFloat64(
                0,
                value,
                true
            );

        return new Uint8Array(buffer);
    }


    function doubleToBigInt(value) {

        const buffer =
            new ArrayBuffer(8);

        const view =
            new DataView(buffer);

        view.setFloat64(
            0,
            value,
            true
        );

        return view.getBigUint64(
            0,
            true
        );
    }


    function encodeSignedLEB64(value) {

        let n = BigInt(value);

        const result = [];

        while (true) {

            let byte =
                Number(
                    n & 0x7Fn
                );

            n >>= 7n;

            const signBit =
                (byte & 0x40) !== 0;

            const finished =
                (
                    n === 0n &&
                    !signBit
                ) ||
                (
                    n === -1n &&
                    signBit
                );

            if (!finished) {
                byte |= 0x80;
            }

            result.push(byte);

            if (finished) {
                break;
            }
        }

        return Uint8Array.from(result);
    }


    function findPattern(
        data,
        pattern,
        start = 0,
        end = data.length
    ) {

        const max =
            Math.min(
                end,
                data.length
            ) - pattern.length;

        for (
            let i = start;
            i <= max;
            i++
        ) {

            let match = true;

            for (
                let j = 0;
                j < pattern.length;
                j++
            ) {

                if (
                    data[i + j] !==
                    pattern[j]
                ) {

                    match = false;
                    break;

                }
            }

            if (match) {
                return i;
            }
        }

        return -1;
    }


    function patchZoom(input) {

        const data =
            new Uint8Array(input);


        /*
         * A assinatura utilizada pelo AgarPlus
         * para localizar o clamp de zoom.
         */

        const normalZoom =
            doubleToBytes(1.0);

        const newZoom =
            doubleToBytes(ZOOM_FLOOR);


        const compareSignature =
            Uint8Array.from([
                0xBF,
                0x44,
                ...normalZoom,
                0x63,
                0x04,
                0x40
            ]);


        const oldLEB =
            encodeSignedLEB64(
                doubleToBigInt(1.0)
            );


        const newLEB =
            encodeSignedLEB64(
                doubleToBigInt(ZOOM_FLOOR)
            );


        /*
         * O tamanho precisa permanecer igual
         * para podermos substituir in-place.
         */

        if (
            oldLEB.length !==
            newLEB.length
        ) {

            console.warn(
                '[Agar Extended Zoom] ' +
                'ZOOM_FLOOR incompatível com patch in-place.'
            );

            return data;
        }


        let searchPosition = 0;


        while (true) {

            const comparePosition =
                findPattern(
                    data,
                    compareSignature,
                    searchPosition
                );


            if (
                comparePosition === -1
            ) {

                break;

            }


            searchPosition =
                comparePosition +
                compareSignature.length;


            const storeSignature =
                Uint8Array.from([
                    0x42,
                    ...oldLEB,
                    0x37,
                    0x00,
                    0x00
                ]);


            const storePosition =
                findPattern(
                    data,
                    storeSignature,
                    comparePosition +
                    compareSignature.length,
                    Math.min(
                        data.length,
                        comparePosition + 300
                    )
                );


            if (
                storePosition === -1
            ) {

                continue;

            }


            /*
             * Substitui 1.0 pelo novo limite.
             */

            for (
                let i = 0;
                i < 8;
                i++
            ) {

                data[
                    comparePosition +
                    2 +
                    i
                ] =
                    newZoom[i];

            }


            /*
             * Substitui também a constante
             * utilizada no armazenamento.
             */

            for (
                let i = 0;
                i < newLEB.length;
                i++
            ) {

                data[
                    storePosition +
                    1 +
                    i
                ] =
                    newLEB[i];

            }


            console.log(
                '[Agar Extended Zoom] Ativado:',
                `~${(1 / ZOOM_FLOOR).toFixed(1)}x`
            );


            return data;
        }


        console.warn(
            '[Agar Extended Zoom] ' +
            'Assinatura do zoom não encontrada.'
        );


        return data;
    }


    /*
     * ============================================================
     * INTERCEPTA WebAssembly.instantiateStreaming
     * ============================================================
     */

    if (originalInstantiateStreaming) {

        WASM.instantiateStreaming =
            async function(
                source,
                imports
            ) {

                try {

                    const response =
                        await source;


                    if (
                        response?.url?.includes(
                            'agario.core.wasm'
                        )
                    ) {

                        const buffer =
                            await response
                                .arrayBuffer();


                        return originalInstantiate(
                            patchZoom(buffer),
                            imports
                        );
                    }

                } catch (error) {

                    console.error(
                        '[Agar Extended Zoom]',
                        error
                    );

                }


                return originalInstantiateStreaming(
                    Promise.resolve(response),
                    imports
                );
            };
    }


    /*
     * ============================================================
     * INTERCEPTA WebAssembly.instantiate
     * ============================================================
     */

    WASM.instantiate =
        async function(
            source,
            imports
        ) {

            try {

                /*
                 * Se já for um Module compilado,
                 * não conseguimos alterar os bytes.
                 */

                if (
                    source instanceof
                    WASM.Module
                ) {

                    return originalInstantiate(
                        source,
                        imports
                    );
                }


                let bytes = null;


                if (
                    source instanceof
                    ArrayBuffer
                ) {

                    bytes =
                        new Uint8Array(
                            source.slice(0)
                        );

                } else if (
                    ArrayBuffer.isView(source)
                ) {

                    bytes =
                        new Uint8Array(
                            source.buffer.slice(
                                source.byteOffset,
                                source.byteOffset +
                                source.byteLength
                            )
                        );
                }


                if (bytes) {

                    return originalInstantiate(
                        patchZoom(bytes),
                        imports
                    );
                }


            } catch (error) {

                console.error(
                    '[Agar Extended Zoom]',
                    error
                );
            }


            return originalInstantiate(
                source,
                imports
            );
        };


    /*
     * ============================================================
     * MOUSE 4 → SPACE
     * ============================================================
     *
     * Mouse 4 normalmente é event.button === 3.
     */

    const MOUSE4 = 3;

    let mouse4Down = false;


    function dispatchSpace(type) {

        const event =
            new KeyboardEvent(
                type,
                {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32,
                    which: 32,
                    bubbles: true,
                    cancelable: true
                }
            );


        page.dispatchEvent(event);
        document.dispatchEvent(event);
    }


    page.addEventListener(
        'mousedown',
        event => {

            if (
                event.button !== MOUSE4
            ) {
                return;
            }


            event.preventDefault();


            if (mouse4Down) {
                return;
            }


            mouse4Down = true;

            dispatchSpace('keydown');

        },
        true
    );


    page.addEventListener(
        'mouseup',
        event => {

            if (
                event.button !== MOUSE4
            ) {
                return;
            }


            event.preventDefault();

            mouse4Down = false;

            dispatchSpace('keyup');

        },
        true
    );


    page.addEventListener(
        'blur',
        () => {

            if (!mouse4Down) {
                return;
            }

            mouse4Down = false;

            dispatchSpace('keyup');

        }
    );


    console.log(
        '[Agar Extended Zoom] ' +
        'Userscript carregado.'
    );

})();

