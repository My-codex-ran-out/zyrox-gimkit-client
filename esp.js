// ==UserScript==
// @name         Gimkit ESP (No GUI)
// @description  Standalone ESP extracted from example.js without GUI/modules
// @namespace    https://www.github.com/TheLazySquid/GimkitCheat/
// @match        https://www.gimkit.com/join*
// @run-at       document-start
// @icon         https://www.gimkit.com/favicon.png
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  'use strict';

  function getUnsafeWindow() {
    if (typeof unsafeWindow === 'undefined') return window;
    return unsafeWindow;
  }

  function waitForBody() {
    return new Promise((resolve) => {
      if (document.body) return resolve();
      window.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }

  function createOverlayCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    return canvas;
  }

  async function initESP() {
    await waitForBody();

    const canvas = createOverlayCanvas();
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', onResize);

    // 1:1 behavior target from example module, but always enabled due to no GUI.
    const highlightTeammates = true;
    const highlightEnemies = true;

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!highlightTeammates && !highlightEnemies) return;

      const uw = getUnsafeWindow();
      const scene = uw?.stores?.phaser?.scene;
      const camera = scene?.cameras?.cameras?.[0];
      const characters = scene?.characterManager?.characters;
      const mainCharacter = uw?.stores?.phaser?.mainCharacter;

      if (!camera || !characters || !mainCharacter) return;

      const camX = camera.midPoint.x;
      const camY = camera.midPoint.y;

      for (const [id, character] of characters) {
        if (!character?.isActive) continue;
        if (id === mainCharacter.id) continue;

        const isTeammate = mainCharacter.teamId === character.teamId;
        if (isTeammate && !highlightTeammates) continue;
        if (!isTeammate && !highlightEnemies) continue;

        // Same ESP arrow math from example.js PlayerHighlighter.
        const angle = Math.atan2(character.y - camY, character.x - camX);
        const distance = Math.sqrt(Math.pow(character.x - camX, 2) + Math.pow(character.y - camY, 2)) * camera.zoom;
        const arrowDist = Math.min(250, distance);
        const arrowTipX = Math.cos(angle) * arrowDist + canvas.width / 2;
        const arrowTipY = Math.sin(angle) * arrowDist + canvas.height / 2;
        const leftAngle = angle + (Math.PI / 4) * 3;
        const rightAngle = angle - (Math.PI / 4) * 3;

        ctx.beginPath();
        ctx.moveTo(arrowTipX, arrowTipY);
        ctx.lineTo(arrowTipX + Math.cos(leftAngle) * 50, arrowTipY + Math.sin(leftAngle) * 50);
        ctx.moveTo(arrowTipX, arrowTipY);
        ctx.lineTo(arrowTipX + Math.cos(rightAngle) * 50, arrowTipY + Math.sin(rightAngle) * 50);
        ctx.lineWidth = 3;
        ctx.strokeStyle = isTeammate ? 'green' : 'red';
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.font = '20px Verdana';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${character.name ?? 'Player'} (${Math.floor(distance)})`, arrowTipX, arrowTipY);
      }
    }

    setInterval(render, 1000 / 30);
  }

  initESP();
})();
