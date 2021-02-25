// ==UserScript==
// @name         Lichess Whisper Switch by ipr
// @namespace    http://tampermonkey.net/
// @version      0.2.4
// @description  A simple GreaseMonkey script to toggle auto-whisper on/off and at the same time prepending the current move
// @author       You
// @match        https://lichess.org/*
// @grant        GM_addStyle
// @run-at document-end
// ==/UserScript==

/* jshint esversion: 6 */

function blackMoved(){
    return document.getElementsByTagName('l4x')[0].children.length % 3 == 0;
}

function getFormattedMoveNumber(){
    const move_number = Math.round(document.getElementsByTagName('l4x')[0].children.length / 3);
    const move = document.getElementsByTagName('l4x')[0].children[document.getElementsByTagName('l4x')[0].children.length -1].textContent
    if (blackMoved()) {
        return "(" + move_number + "..." + move + ")";
    }
    else {
        return "(" + move_number + "." + move + ")";
    }
}

function shouldPrependMove(){
    const moves_have_been_played = Boolean(document.getElementsByTagName('l4x')[0]);
    return document.getElementsByClassName("header")[0].textContent.includes("Playing right now");
}

var whisper = (event)=>{
    var chatbox = document.getElementsByClassName('mchat__say')[0];
    const inputValue = event.currentTarget.value;
        if (shouldPrependMove()){

            var matcher = new RegExp(escapeRegExp("/w " + getFormattedMoveNumber()), "i");
            chatbox.value = matcher.test(inputValue) ? chatbox.value : '/w ' + getFormattedMoveNumber() + " " + chatbox.value;
        }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


var nowhisper = (event)=>{
    var chatbox = document.getElementsByClassName('mchat__say')[0];
    const inputValue = event.currentTarget.value;
        if (shouldPrependMove()){
            var matcher = new RegExp(escapeRegExp(getFormattedMoveNumber()), "i");
            chatbox.value = matcher.test(inputValue) ? chatbox.value : getFormattedMoveNumber() + " " + chatbox.value;
        }
}


function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function userInPlayers(player, index, array){
    return player.textContent.includes(document.getElementById("user_tag").text);
}

function userIsPlaying(){
    const players = Array.from(document.getElementsByClassName("game__meta__players")[0].children);
    return players.filter(userInPlayers).length != 0;
}

var checkIfChatBoxExists = setInterval(function() {
    var chatbox = document.getElementsByClassName('mchat__say')[0];

    if (chatbox) {
        clearInterval(checkIfChatBoxExists);
        if (userIsPlaying()){
            // we reset the chatbox value otherwise it will transfer from game to game
            chatbox.value = "";
            chatbox.oninput = whisper;
        }
        else{
            // we reset the chatbox value otherwise it will transfer from game to game
            chatbox.value = "";
            chatbox.oninput = nowhisper;
        }
    }
}, 25);

var checkIfMetaExists = setInterval(function() {
    var material = document.getElementsByClassName("game__meta")[0];
    var chatbox = document.getElementsByClassName('mchat__say')[0];

    if (material && chatbox) {
        clearInterval(checkIfMetaExists);

        if (userIsPlaying()){
            var whisper_btn = document.createElement ('div');
            whisper_btn.innerHTML = '<button id="whisperButton" type="button">Whisper</button>';
            insertAfter(material, whisper_btn);
            document.getElementById ("whisperButton").addEventListener (
                "click", ButtonClickAction, false);
            }
    }
}, 25);


function ButtonClickAction (zEvent) {
    var chatbox = document.getElementsByClassName('mchat__say')[0];

    if (chatbox.oninput == whisper){
        document.getElementById("whisperButton").style.background="#AD0000";
        chatbox.oninput = nowhisper;
    }
    else {
        document.getElementById("whisperButton").style.background="#4CAF50";
        chatbox.oninput = whisper;
    }
}

//--- Style our newly added elements using CSS.
GM_addStyle ( `
    #myContainer {
        position:               absolute;
        top:                    0;
        left:                   0;
        font-size:              10px;
        margin:                 5px;
        opacity:                0.9;
        z-index:                1100;
        padding:                5px 20px;
    }
    #whisperButton {
        background-color: #4CAF50; /* Green */
        border: none;
        color: white;
        padding: 12px 12px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 12px;
    }
` );
