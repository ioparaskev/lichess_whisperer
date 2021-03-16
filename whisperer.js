// ==UserScript==
// @name         Lichess Whisper Switch by ipr
// @namespace    http://tampermonkey.net/
// @version      0.3.3
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

function gameInProgress(){
    return document.getElementsByClassName("header")[0].textContent.includes("Playing right now");
}

function shouldPrepend(){
    const moves_have_been_played = Boolean(document.getElementsByTagName('l4x')[0]);
    return moves_have_been_played && gameInProgress();
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


var whisper = (event)=>{
    var chatbox = document.getElementsByClassName('mchat__say')[0];
    const inputValue = event.currentTarget.value;
    if (shouldPrepend()){
        var matcher = new RegExp(escapeRegExp("/w " + getFormattedMoveNumber()), "i");
        chatbox.value = matcher.test(inputValue) ? chatbox.value : '/w ' + getFormattedMoveNumber() + " " + chatbox.value;

        // strip any extra occurences of /w
        // solves issue when having the whisper on and switching prepend move from off -> on
        chatbox.value = chatbox.value.replace(/\/w/g, (i => m => !i++ ? m : '')(0));

        // strip any extra occurences of move number
        // solves issue when having prepend move on and switching whisper from off -> on
        const move_number_matcher = new RegExp(escapeRegExp(getFormattedMoveNumber()), "g");
        chatbox.value = chatbox.value.replace(move_number_matcher, (i => m => !i++ ? m : '')(0));

    }
}

var whisper_no_move = (event)=>{
    var chatbox = document.getElementsByClassName('mchat__say')[0];
    const inputValue = event.currentTarget.value;
    if (shouldPrepend()){
        var matcher = new RegExp(escapeRegExp("/w "), "i");
        chatbox.value = matcher.test(inputValue) ? chatbox.value : '/w ' + chatbox.value;
    }
}

var nowhisper = (event)=>{
    var chatbox = document.getElementsByClassName('mchat__say')[0];
    const inputValue = event.currentTarget.value;
    if (shouldPrepend()){
        // make sure there's no whisper prepend leftover
        chatbox.value = chatbox.value.replace(/^\/w\s/i,"");

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


var checkIfMetaExists = setInterval(function() {
    var material = document.getElementsByClassName("game__meta")[0];
    var chatbox = document.getElementsByClassName('mchat__say')[0];

    if (material && chatbox) {
        clearInterval(checkIfMetaExists);

        var div_block = document.createElement ('div');
        div_block.setAttribute("id", "Whisperer")
        if (gameInProgress()){
            div_block.innerHTML = '<button id="whisperButton" type="button">Whisper</button><button id="prependMoveButton" type="button">Prepend move</button><input type="checkbox" id="hiddenPrependMoveSwitch" value="on" class="hidden"><input type="checkbox" id="hiddenWhisperSwitch" value="on" class="hidden">';
            insertAfter(material, div_block);

            document.getElementById ("whisperButton").addEventListener (
                "click", whisperClickAction, false);
            document.getElementById ("prependMoveButton").addEventListener (
                "click", prependMoveClickAction, false);

            if (!userIsPlaying()){
                document.getElementById("hiddenWhisperSwitch").value = "off";
                document.getElementById("whisperButton").style.display = "none";
            }

            setChatboxInputMode();
        }
        else {
            div_block.innerHTML = '<button id="whisperButton" type="button">Whisper</button><button id="prependMoveButton" type="button">Prepend move</button><input type="checkbox" id="hiddenPrependMoveSwitch" value="off" class="hidden"><input type="checkbox" id="hiddenWhisperSwitch" value="off" class="hidden">';
            insertAfter(material, div_block);
        }
    }
}, 25);

var checkStatusUpdates = setInterval(function() {
    if (document.getElementsByClassName("result-wrap")[0]){
        document.getElementById("hiddenWhisperSwitch").value = "off";
        document.getElementById("hiddenPrependMoveSwitch").value = "off";
        document.getElementById("Whisperer").style.display = "none";
        whisperClickAction();
        prependMoveClickAction();
        clearInterval(checkStatusUpdates);
    }

}, 25);


function setChatboxInputMode(){
    var chatbox = document.getElementsByClassName('mchat__say')[0];
    const whisper_switch_value = document.getElementById("hiddenWhisperSwitch").value;
    const prepend_switch_value = document.getElementById("hiddenPrependMoveSwitch").value

    if (whisper_switch_value == "on"){
        if (prepend_switch_value == "on"){
            chatbox.oninput = whisper;
        }
        else{
            chatbox.oninput = whisper_no_move;
        }
    }
    else{
        if (prepend_switch_value == "on"){
            chatbox.oninput = nowhisper;
        }
        else{
            chatbox.oninput = null;
        }
    }
}



function whisperClickAction (zEvent) {
    const whisper_switch_value = document.getElementById("hiddenWhisperSwitch").value;

    if (whisper_switch_value == "off"){
        document.getElementById("whisperButton").style.background="#4CAF50";
        document.getElementById("hiddenWhisperSwitch").value = "on";
    }
    else{
        document.getElementById("whisperButton").style.background="#AD0000";
        document.getElementById("hiddenWhisperSwitch").value = "off";
    }
    setChatboxInputMode();
}

function prependMoveClickAction (zEvent) {
    const prepend_switch_value = document.getElementById("hiddenPrependMoveSwitch").value

    if (prepend_switch_value == "on"){
        document.getElementById("hiddenPrependMoveSwitch").value = "off";
        document.getElementById("prependMoveButton").style.background="#AD0000";
    }
    else {
        document.getElementById("hiddenPrependMoveSwitch").value = "on";
        document.getElementById("prependMoveButton").style.background="#4CAF50";
    }
    setChatboxInputMode();
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
    #prependMoveButton {
        background-color: #4CAF50; /* Green */
        border: none;
        color: white;
        padding: 12px 12px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 12px;
    }
    #whisperButton  + #prependMoveButton{
      margin-left:2px;
    }
    #hiddenPrependMoveSwitch {
        display: none;
    }
    #hiddenWhisperSwitch {
        display: none;
    }
` );
