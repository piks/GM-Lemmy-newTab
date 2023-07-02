// ==UserScript==
// @name         GM Lemmy NewTab
// @namespace    https://github.com/piks/GM-Lemmy-newTab
// @originalSource https://github.com/Djones4822/GM-Lemmy-newTab
// @description  Open links in new tab. Ctrl-click or Middle-click loads it in background
// @match        https://*/*
// @version      1.0.1
// @author       giddy@beehaw.org, Djones4822, contributor: pika@lemmy.world, piks
// @run-at       document-idle
// @license      MIT
// @updateURL    https://github.com/piks/GM-Lemmy-newTab/raw/main/lemmy.newtab.user.js
// @installURL   https://github.com/piks/GM-Lemmy-newTab/raw/main/lemmy.newtab.user.js
// @require      https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config.js
// @grant        GM.openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// ==/UserScript==

var suppressing, clickedElement, curHost;
const isLemmy = document.head.querySelector("[name~=Description][content]")?.content === "Lemmy";
const newTabPages = ["/post/", "/u/"];

if(isLemmy){  // ignore everything if we aren't on a Lemmy Instance
	curHost = document.location.hostname;
	function verifyNewTab(link){
		for (let item of newTabPages){
			if (link.href.indexOf(curHost+item) >= 0 || link.href.startsWith(item)){
				return true;
			}
		}
		return false;
	}
	window.addEventListener('mousedown', function (e) {
		if (!(document.head.querySelector("[name~=Description][content]")?.content === "Lemmy")) {
			return;
		}
		clickedElement = e.target;
	}, true);

	window.addEventListener('mouseup', function (e) {
		// ignore right and middle clicks, if the alt key is being held, or if we've moved our mouse off the clicked element before releasing
		if (e.button > 1 || e.altKey || e.target != clickedElement) {
			return;
		}
		var link = e.target.closest('a');

		// ignore if there is no a tag within the element clicked or there is an a tag but it doesn't lead anywhere
		if (!link || !link.href) {
			return;
		}

		// Don't open links that just expand the view
		if (link.getAttributeNode('aria-label') && link.getAttributeNode('aria-label').value == 'Expand here') {
			return;
		}

		//if return treat normal method as no tab
		//check internal
		if (link.href.indexOf(curHost)>=0 || link.href.startsWith("/")){
			if (verifyNewTab(link)){
				if (!settings_config.get("new-tab")){
					//new tab disabled so making same link
					return;
				}
			}
			else{
				//this is an internal link that is not a post so preventing new tab
				return;
			}
		}
		GM.openInTab(link.href, !(!e.button && !e.ctrlKey));
		// suppressing is used to avoid accidental multiple clicks? 
		suppressing = true;

		// Dispatch the mouse up and bubble it so all listeners are triggered from other frameworks (ie: react)
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
}


/*
add config menu
*/
let settings_config = new GM_config(
	{
		'id': 'new-tab', // The id used for this instance of GM_config
		'title': 'Script Settings', // Panel Title
		'fields': // Fields object
		{
			'new-tab': // This is the id of the field
			{
				'label': 'Open new user and post links in new tab, otherwise default action',
				'type': 'checkbox', 
				'default': false
			}
		},
		'events':{
			'save':
				function(){
					this.close();
				}
		}
	}
);
GM.registerMenuCommand('Open New-Tab Settings', 
	function(){
		settings_config.open();
	}
)