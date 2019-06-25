// GLOBALS
// Static
var firebaseConfig = {
    apiKey: "AIzaSyCte7lhLlrSr3m3turhqLQQy3_3YSBymWE",
    authDomain: "trilogy-r-p-s.firebaseapp.com",
    databaseURL: "https://trilogy-r-p-s.firebaseio.com",
    projectId: "trilogy-r-p-s",
    storageBucket: "trilogy-r-p-s.appspot.com",
    messagingSenderId: "545722149214",
    appId: "1:545722149214:web:633cee7329b7a2af"
};

firebase.initializeApp(firebaseConfig);

var database = firebase.database();

var winConditions = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
};

// Dynamic
var user = {
    name: null,
    wins: 0,
    losses: 0
};

var rpsDirectory = database.ref('rpsHomework');
var userDirectory;
var playerDirectory;
var opponentDirectory;

var playerWeapon = false;
var opponentWeapon = false;

var gamePaused = false;



// FUNCTIONS
function setUserStatus() {
    userDirectory.onDisconnect().update({ // If we disconnect, let Firebase know
        online: false
    });

    userDirectory.update({ // Let Firebase know we're online
        online: true
    });
}

function setPlayerStatus() {
    playerDirectory.onDisconnect().update({ // Reset our players when they go offline
        name: false,
        wins: false,
        losses: false,
        weapon: false,
        online: false
    });

    playerDirectory.update({
        online: true
    });
}

function checkPlayerSlotOpen() {
    rpsDirectory.once('value', snapshot => {
        let player1Status = snapshot.val().player1.online; // snapshot.val() returns a JS object
        let player2Status = snapshot.val().player2.online;

        if (!player1Status) { // Player 1 is offline
            playerDirectory = database.ref('rpsHomework/player1');
            opponentDirectory = database.ref('rpsHomework/player2');
        }
        else if (!player2Status) { // Player 2 is offline
            playerDirectory = database.ref('rpsHomework/player2');
            opponentDirectory = database.ref('rpsHomework/player1');
        }
        else {
            alert('Sorry, there aren\'t any spots currently open.');
            return;
        }

        checkUserExists();
    }, function (error) {
        console.log("Error: " + error.code);
    });
}

function checkUserExists() {
    userDirectory.once('value', snapshot => {
        if (snapshot.exists()) { // If we have that name in registry...
            if (snapshot.val().online) { // Check if someone is already online with that name
                alert('Looks like your opponent has already selected that name. Please pick another one.');
                return;
            }
        }
        else { // If we don't have that name...
            userDirectory.set(user); // Make it!!
        }

        playerSetup();

    }, function (error) {
        console.log("Error: " + error.code);
    });
}

function playerSetup() {
    setUserStatus(); // Establish user status updates
    setPlayerStatus(); // And player status updates

    $('#playerName').text(user.name); // Put our name on the page

    userDirectory.on('value', snapshot => { // When our userDirectory changes, update our playerDirectory and the page
        playerDirectory.update(snapshot.val());

        user.wins = snapshot.val().wins; // Get our wins from Firebase
        user.losses = snapshot.val().losses; // And our losses

        $('#playerWinsLosses').text('Wins: ' + user.wins + ' / Losses: ' + user.losses); // Display them on the page
    }, function (error) {
        console.log("Error: " + error.code);
    });

    opponentDirectory.on('value', snapshot => { // When our opponentDirectory changes, update the page
        if (snapshot.val().online) { // If they're online...
            opponentWeapon = snapshot.val().weapon;

            if (opponentWeapon && !gamePaused) { // So it doesn't update based on latency after the game is over
                $('#opponentWeapon').text('selected');
            }

            let wins = snapshot.val().wins;
            let losses = snapshot.val().losses;

            $('#opponentName').text(snapshot.val().name);
            $('#opponentWinsLosses').text('Wins: ' + wins + ' / Losses: ' + losses); // Display them on the page
        }
        else {
            $('#opponentName').text('');
            $('#opponentWinsLosses').text('');
            $('#opponentWeapon').text('');
        }
    }, function (error) {
        console.log("Error: " + error.code);
    });

    $('header').css('visibility', 'hidden'); // Hide our header but keep its spacing
    $('section').css('visibility', 'visible'); // Let's see the game!

    setInterval(checkWeapons, 500);
}

function checkWeapons() {
    if (playerWeapon && opponentWeapon) {
        $('#opponentWeapon').text(opponentWeapon); // Reveal what our opponent selected

        if (playerWeapon === opponentWeapon) {
            $('#result').text('TIE!').css('color', '#ffd644');
        } else if (winConditions[playerWeapon] === opponentWeapon) {
            $('#result').text('You win!').css('color', '#2ee228');
            user.wins++;
            userDirectory.update({ wins: user.wins });
        } else {
            $('#result').text('You lost.').css('color', '#e22828');
            user.losses++;
            userDirectory.update({ losses: user.losses });
        }

        playerWeapon = false; // So we don't infinitly loop
        gamePaused = true;
        setTimeout(function () { // Wait a second to update the server so the other player can update their page
            playerDirectory.update({ weapon: false });
        }, 1000);

        setTimeout(function () { // Wait 3 seconds then start the game over
            $('.weaponButton').css('visibility', 'visible');
            $('#playerWeapon').text('');
            $('#result').text('');
            $('#opponentWeapon').text('');
            gamePaused = false;
        }, 3000);
    }
}

function setupDirectory() {
    user.name = $('#nameInput').val();
    userDirectory = database.ref('rpsHomework/registry/' + user.name);

    checkPlayerSlotOpen(); // Now we check if there's room
}



// DIRECT FUNCTION CALLS
$(document).ready(function () {
    $('#selectName').on('click', function () { // When we click 'select name'
        setupDirectory(); // First we set up our userDirectory
    });

    $('#nameInput').on('keypress', function (event) { // When we press enter in the input field
        if (event.keyCode === 13) {
            setupDirectory();
        }
    });

    $('.weaponButton').on('click', function () { // When we click a weapon
        playerWeapon = $(this).attr('id');
        $('.weaponButton').css('visibility', 'hidden'); // Hide our button once we've selected a weapon

        playerDirectory.update({ weapon: playerWeapon });
        $('#playerWeapon').text(playerWeapon);
    });
});
