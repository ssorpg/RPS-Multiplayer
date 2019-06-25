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
}

// Dynamic
var user = {
    name: null,
    wins: 0,
    losses: 0
}

var rpsDirectory = database.ref('rpsHomework');
var userDirectory;
var playerDirectory;
var opponentDirectory;

var playerWeapon = false;
var opponentWeapon = false;
var weaponsDisabled = false;



// FUNCTIONS
function setStatus(thisDirectory) {
    thisDirectory.onDisconnect().update({ // If we disconnect, let Firebase know
        online: false
    });

    thisDirectory.update({ // Let Firebase know we're online
        online: true
    });
}

function checkPlayerSlotOpen() {
    rpsDirectory.once('value', snapshot => {
        let player1Status = snapshot.val().player1.online;
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
    })
}

function checkUserExists() {
    userDirectory.once('value', snapshot => {
        if (snapshot.exists()) { // If we have that name in registry...
            if (snapshot.val().online) { // Check if someone is already online with that name
                alert('Looks like your opponent has already selected that name. Please pick another one.')
                return;
            }
        }
        else { // If we don't have that name...
            userDirectory.set(user); // Make it!!
        }

        playerSetup();

    }, function (error) {
        console.log("Error: " + error.code);
    })
}

function playerSetup() {
    setStatus(userDirectory); // Establish user status updates
    setStatus(playerDirectory); // And player status updates

    $('#playerName').text(user.name); // Put our name on the page

    userDirectory.on('value', snapshot => { // When our userDirectory changes, update the page and our playerDirectory
        playerDirectory.update(snapshot.val());

        user.wins = snapshot.val().wins; // Get our wins from Firebase
        user.losses = snapshot.val().losses; // And our losses

        $('#playerWinsLosses').text('Wins: ' + user.wins + ' / Losses: ' + user.losses); // Display them on the page
    })

    playerDirectory.once('value', snapshot => {
        checkWeapons(); // Let's see who won...
    })

    opponentDirectory.on('value', snapshot => { // When our opponentDirectory changes, update the page
        if (snapshot.val().online) { // If they're online...
            opponentWeapon = snapshot.val().weapon;

            let wins = snapshot.val().wins;
            let losses = snapshot.val().losses;

            $('#opponentName').text(snapshot.val().name);
            $('#opponentWinsLosses').text('Wins: ' + wins + ' / Losses: ' + losses); // Display them on the page
        }
        else {
            $('#opponentName').text('');
            $('#opponentWinsLosses').text('');
        }
    })

    $('header').css('visibility', 'hidden'); // Hide our header but keep its spacing
    $('section').css('visibility', 'visible'); // Let's see the game!

    setInterval(checkWeapons, 1000);
}

function checkWeapons() {
    if (playerWeapon && opponentWeapon) {
        if (playerWeapon === opponentWeapon) {
            $('#result').text('TIE!').css('color', '#fff53a');
        } else if (winConditions[playerWeapon] === opponentWeapon) {
            $('#result').text('You win!').css('color', '#2ee228');
            user.wins++;
            userDirectory.update({ wins: user.wins });
        } else {
            $('#result').text('You lost.').css('color', '#e22828');
            user.losses++;
            userDirectory.update({ losses: user.losses });
        }

        playerWeapon = false;
        setTimeout(playerDirectory.update({ weapon: false }), 2000);
    }
}



// DIRECT FUNCTION CALLS
$(document).ready(function () {
    $('#selectName').on('click', function () {
        user.name = $('#nameInput').val();
        userDirectory = database.ref('rpsHomework/registry/' + user.name);

        checkPlayerSlotOpen(); // First we check if there's room
    })

    $('.weaponButton').on('click', function () {
        playerWeapon = $(this).attr('id');
        $('#result').text('');

        playerDirectory.update({ weapon: playerWeapon });
        $('#yourWeapon').text(playerWeapon);
    })
})
