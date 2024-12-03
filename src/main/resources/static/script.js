'use strict';

// DOM elements
var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var groupSelect = document.querySelector('#group-select');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var stompClient = null;
var username = null;
var currentSubscription = null;

function connect(event) {
    username = document.querySelector('#name').value.trim();
    var selectedGroup = groupSelect.options[groupSelect.selectedIndex].value;

    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function() {
            onConnected(selectedGroup);
        }, onError);
    }
    event.preventDefault();
}

function onConnected(group) {
    subscribeToGroup(group);

    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({ sender: username, type: 'JOIN' })
    );

    connectingElement.classList.add('hidden');
}

function subscribeToGroup(group) {
    if (currentSubscription) {
        currentSubscription.unsubscribe();
    }
    currentSubscription = stompClient.subscribe(`/topic/${group.toLowerCase()}`, onMessageReceived);
    clearMessages();
}

function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    var selectedGroup = groupSelect.options[groupSelect.selectedIndex].value;

    if (messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            message: messageContent,
            group: selectedGroup.toUpperCase(),
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');

    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.message = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.message = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');
        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.message);
    textElement.appendChild(messageText);
    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function clearMessages() {
    messageArea.innerHTML = '';
}

usernameForm.addEventListener('submit', connect, true);
groupSelect.addEventListener('change', function(event) {
    var selectedGroup = event.target.value;
    subscribeToGroup(selectedGroup);
}, true);
messageForm.addEventListener('submit', sendMessage, true);