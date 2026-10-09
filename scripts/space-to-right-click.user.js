// ==UserScript==
// @name         Agar.io — Left Click = Space
// @namespace    agar-left-click-space
// @version      1.0.0
// @description  Faz o botão esquerdo do mouse executar a função do Space.
// @match        https://agar.io/*
// @match        https://*.agar.io/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    let leftDown = false;

    function sendSpace(type) {
        const event = new KeyboardEvent(type, {
            key: ' ',
            code: 'Space',
            keyCode: 32,
            which: 32,
            bubbles: true,
            cancelable: true
        });

        window.dispatchEvent(event);
        document.dispatchEvent(event);
    }

    window.addEventListener('mousedown', event => {

        // Botão esquerdo
        if (event.button !== 0)
            return;

        // Evita disparar duas vezes
        if (leftDown)
            return;

        leftDown = true;

        sendSpace('keydown');

    }, true);


    window.addEventListener('mouseup', event => {

        if (event.button !== 0)
            return;

        leftDown = false;

        sendSpace('keyup');

    }, true);


    // Se a janela perder foco enquanto o botão estiver pressionado,
    // garante que o Space seja liberado.
    window.addEventListener('blur', () => {

        if (!leftDown)
            return;

        leftDown = false;

        sendSpace('keyup');

    });


    console.log(
        '[Agar Left Click] Botão esquerdo = Space'
    );

})();
