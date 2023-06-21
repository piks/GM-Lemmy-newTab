// ==UserScript==
// @name         GM Lemmy NewTab
// @description  Open links in new tab. Ctrl-click or Middle-click loads it in background
// @match        https://*/*
// @version      1.0.0
// @grant        GM_openInTab
// @author       giddy@beehaw.org, Djones4822
// @run-at       document-start
// source-url    https://github.com/Djones4822/GM-Lemmy-newTab

// ==/UserScript==

var suppressing, clickedElement;
var curHost = document.location.hostname;

window.addEventListener('mousedown', function (e) {
  if (!(document.head.querySelector("[name~=Description][content]")?.content === "Lemmy")) {
    return;
  }
  clickedElement = e.target;
}, true);

window.addEventListener('mouseup', function (e) {
  if (!(document.head.querySelector("[name~=Description][content]")?.content === "Lemmy")) {
    return;
  }
  // ignore right and middle clicks, if the alt key is being held, or if we've moved our mouse off the clicked element before releasing
  if (e.button > 1 || e.altKey || e.target != clickedElement) {
    console.log('First check failure');
    return;
  }
  var link = e.target.closest('a');

  // ignore if there is no a tag within the element clicked or there is an a tag but it doesn't lead anywhere
  if (!link || !link.href) {
    console.log('Second check failure');
    return;
  }

  // Don't open links that just expand the view
  if (link.getAttributeNode('aria-label') && link.getAttributeNode('aria-label').value == 'Expand here') {
    console.log('Third check failure');
    return;
  }

  // If we're going somewhere in the site that isn't a post, treat like normal
  if (link.href.indexOf(curHost) >= 0 && !link.href.indexOf(curHost + '/post/') >= 0) {
    console.log('Fourth check failure');
    return;
  }


  console.log('Opening in new tab!')
  GM_openInTab(link.href, {
    active: !e.button && !e.ctrlKey,
    setParent: true,
    insert: true,
  });

  // suppressing is used to avoid accidental multiple clicks? 
  console.log('Suppressing...')
  suppressing = true;

  // Dispatch the mouse up and bubble it so all listeners are triggered from other frameworks (ie: react)
  console.log('Mouseup timeout')
  setTimeout(function () {
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  prevent(e);
}, true);

// add the prevent function listeners

window.addEventListener('click', prevent, true);
window.addEventListener('auxclick', prevent, true);

/*
* Function used to avoid duplicate link clicks, when `supressing` is true then the events are stopped. 
*/
function prevent(e) {
  if (!(document.head.querySelector("[name~=Description][content]")?.content === "Lemmy")) {
    return;
  }
  if (!suppressing) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  setTimeout(function () {
    suppressing = false;
  }, 100);
}
