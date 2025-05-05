// Global variables
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var scoreChart = null;

// Game variables
var x = canvas.width/2;
var y = canvas.height/2;
var ballRadius = 6;
var dx = 3;
var dy = -3;
var m = 0;
var j = 0;
var aiSpeed = 1.25;
var paddleHeight = 10;
var paddleWidth = 30;
var paddleX = (canvas.width-paddleWidth);
var rightPressed = false;
var leftPressed = false;  
var goalpostWidth = 150;
var goalpostHeight = 10;
var homeScore = 0;
var awayScore = 0;
var playerHeight = 50;
var playerWidth = 30;
var initFlag = true;
var gameOver = false;
var flag1 = 1;
var flag2 = 1;
var drawFlag = true;
var countdown;

// Additional game statistics
var ballPossessionHome = 0; // Percentage for home team
var ballPossessionAway = 0; // Percentage for away team
var shotsOnGoalHome = 0; // Shots on goal for home team
var shotsOnGoalAway = 0; // Shots on goal for away team


// SAT.js variables
var V = SAT.Vector;
var C = SAT.Circle;
var B = SAT.Box;
var circle;
var box;

// Images
var homePlayer = new Image();
var awayPlayer = new Image();

// Score log
var scoreLog = [];

// Event listeners
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

// Initialize game
function init() {
    removeStatus();
    homePlayer.src = 'img/homePlayer.png';
    awayPlayer.src = 'img/awayPlayer.png';
    document.getElementById('startScreen').style['z-index'] = '-1';
    document.getElementById('gameOverScreen').style['z-index'] = '-1';
    document.getElementById('home').innerHTML = '0';
    document.getElementById('away').innerHTML = '0';
    awayScore = 0;
    homeScore = 0;
    gameOver = false;
    scoreLog = [];
    
    // Reset chart
    if (scoreChart) {
        scoreChart.destroy();
        scoreChart = null;
    }
    document.getElementById('chart-container').style.display = 'none';
    
    setInitialDelay();
}

function setInitialDelay() {
    setTimeout(function() {
        startTimer(60 * 2);
        drawFlag = true;
        window.requestAnimationFrame(draw);
        updateStatus('You are team <br> in <span style="color:red">RED</span>');
    }, 1500);
}

function setDelay() {
    setTimeout(function() {
        drawFlag = true;
        window.requestAnimationFrame(draw);
    }, 1500);
}

function startTimer(duration) {
    var timer = duration, minutes, seconds;
    clearInterval(countdown); // Clear any existing timer
    
    countdown = setInterval(function() {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        document.getElementById('countdown').innerHTML = minutes + ":" + seconds;

        if (--timer < 0) {
            document.getElementById('gameOverScreen').style['z-index'] = 3;
            document.getElementById('showGraph').style.display = 'block'; // Show the button
            gameOver = true;
            clearInterval(countdown);
            if (homeScore > awayScore)
                updateStatus('GAME OVER!<br>Bileperov Won!');
            else if (awayScore > homeScore)
                updateStatus('GAME OVER!<br>Tripodilum Won!');
            else
                updateStatus('GAME OVER!<br>Draw!');
        }
    }, 1000);
}

function showGraphModal() {
    // Create a new window or a modal to display the graph and stats
    const graphWindow = window.open("", "StatsWindow", "width=600,height=400");
    graphWindow.document.write("<html><head><title>Game Stats</title></head><body>");
    graphWindow.document.write("<h1>Game Stats</h1>");
    
    // Display additional stats
    graphWindow.document.write("<h2>Ball Possession</h2>");
    graphWindow.document.write("<p>Tripodilum (Away): " + ballPossessionAway + "%</p>");
    graphWindow.document.write("<p>Bileperov (Home): " + ballPossessionHome + "%</p>");
    
    graphWindow.document.write("<h2>Attempts to Score</h2>");
    graphWindow.document.write("<p>Tripodilum (Away): " + shotsOnGoalAway + "</p>");
    graphWindow.document.write("<p>Bileperov (Home): " + shotsOnGoalHome + "</p>");
    
    // Add the canvas for the score graph
    graphWindow.document.write("<canvas id='statsChart' width='500' height='300'></canvas>");
    graphWindow.document.write("<script src='https://cdn.jsdelivr.net/npm/chart.js'></script>");
    graphWindow.document.write("<script>");
    graphWindow.document.write("const ctx = document.getElementById('statsChart').getContext('2d');");
    graphWindow.document.write("const scoreLog = " + JSON.stringify(scoreLog) + ";");
    graphWindow.document.write("const times = scoreLog.map(entry => entry.time);");
    graphWindow.document.write("const homeScores = scoreLog.map(entry => entry.home);");
    graphWindow.document.write("const awayScores = scoreLog.map(entry => entry.away);");
    graphWindow.document.write("new Chart(ctx, {");
    graphWindow.document.write("type: 'line',");
    graphWindow.document.write("data: {");
    graphWindow.document.write("labels: times,");
    graphWindow.document.write("datasets: [");
    graphWindow.document.write("{ label: 'Tripodilum (Away)', data: homeScores, borderColor: 'blue', fill: false },");
    graphWindow.document.write("{ label: 'Bileperov (Home)', data: awayScores, borderColor: 'red', fill: false }");
    graphWindow.document.write("]");
    graphWindow.document.write("},");
    graphWindow.document.write("options: { responsive: true, plugins: { title: { display: true, text: 'Score Over Time' } } }");
    graphWindow.document.write("});");
    graphWindow.document.write("</script>");
    graphWindow.document.write("</body></html>");
    graphWindow.document.close();
}

// Main game loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPlayers();
    drawGoalPost();
    x += dx;
    y += dy;
    
    if (rightPressed && paddleX * 3 / 4 + m < canvas.width - paddleWidth) {
        m += 2;
    } else if (leftPressed && paddleX / 4 + m > 0) {
        m -= 2;
    }
    
    if (drawFlag && !gameOver) {
        window.requestAnimationFrame(draw);
    }
    if (x > canvas.width / 2) { // If the ball is on the home side
        attemptShot('home');
        updatePossession('home');
    } else { // If the ball is on the away side
        attemptShot('away');
        updatePossession('away');
    }
}

// Drawing functions
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
    circle = new C(new V(x, y), ballRadius);
    
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
        if(x < 0) x = 0;
        if(x > canvas.width) x = canvas.width; 
    }
    if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
        dy = -dy;
    }
}

function drawPlayers() {
    drawHomeTeam();
    drawAwayTeam();
}

function drawHomeTeam() {
    drawGoalkeeper();
    drawDefenders();
    drawMidfielders();
    drawStrikers();
}

function drawAwayTeam() {
    drawAwayGoalkeeper();
    drawAwayDefenders();
    drawAwayMidfielders();
    drawAwayStrikers();
}

function drawGoalPost() {
    // Home goal
    var gphX = (canvas.width - goalpostWidth) / 2;
    var gphY = canvas.height - goalpostHeight;
    ctx.beginPath();
    ctx.rect(gphX, gphY, goalpostWidth, goalpostHeight);
    ctx.fillStyle = "#9C9C9C";
    ctx.fill();
    ctx.closePath();
    box = new B(new V(gphX, gphY), goalpostWidth, goalpostHeight).toPolygon();
    if (goalDetection(box)) {
        updateScore('home');
        updateStatus('GOAL!<br>Tripodilum Score!');
        removeStatus();
        resetBall();
        setDelay();
    }
    
    // Away goal
    var gpaX = (canvas.width - goalpostWidth) / 2;
    var gpaY = paddleHeight - goalpostHeight;
    ctx.beginPath();
    ctx.rect(gpaX, gpaY, goalpostWidth, goalpostHeight);
    ctx.fillStyle = "#9C9C9C";
    ctx.fill();
    ctx.closePath();
    box = new B(new V(gpaX, gpaY), goalpostWidth, goalpostHeight).toPolygon();
    if (goalDetection(box)) {
        updateScore('away');
        updateStatus('GOAL!<br>Bileperov Score!');
        removeStatus();
        resetBall();
        setDelay();
    }
}

function updateScore(goal) {
    const currentTime = document.getElementById('countdown').innerText;

    if (goal === 'home') {
        awayScore += 1;
        document.getElementById('away').innerHTML = awayScore;
    } else {
        homeScore += 1;
        document.getElementById('home').innerHTML = homeScore;
    }

    scoreLog.push({
        time: currentTime,
        home: homeScore,
        away: awayScore
    });
}

function showGraph() {
    const times = scoreLog.map(entry => entry.time);
    const homeScores = scoreLog.map(entry => entry.home);
    const awayScores = scoreLog.map(entry => entry.away);

    const ctx = document.getElementById('statsChart').getContext('2d');
    
    if (!scoreChart) {
        scoreChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: times,
                datasets: [
                    {
                        label: 'Bileperov (Home)',
                        data: homeScores,
                        borderColor: 'blue',
                        fill: false
                    },
                    {
                        label: 'Tripodilum (Away)',
                        data: awayScores,
                        borderColor: 'red',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Score Over Time'
                    }
                }
            }
        });
    } else {
        scoreChart.data.labels = times;
        scoreChart.data.datasets[0].data = homeScores;
        scoreChart.data.datasets[1].data = awayScores;
        scoreChart.update();
    }
}

function drawGoalkeeper() {

    var gkX = paddleX / 2 + m;
    var gkY = canvas.height * 7 / 8 - paddleHeight;
    ctx.drawImage(homePlayer, gkX, gkY - 15, playerWidth, playerHeight);
    drawRods(gkY);
    box = new B(new V(gkX, gkY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, gkX);

}


function drawDefenders() {

    var lcbX = paddleX / 4 + m;
    var lcbY = canvas.height * 13 / 16 - paddleHeight;
    drawRods(lcbY);
    ctx.drawImage(homePlayer, lcbX, lcbY - 15, playerWidth, playerHeight);
    box = new B(new V(lcbX, lcbY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, lcbX);

    var rcbX = paddleX * 3 / 4 + m;
    var rcbY = canvas.height * 13 / 16 - paddleHeight;
    ctx.drawImage(homePlayer, rcbX, rcbY - 15, playerWidth, playerHeight);
    box = new B(new V(rcbX, rcbY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, rcbX);
}

function drawMidfielders() {

    //midfielders
    var lwbX = paddleX * 1 / 8 + m;
    var lwbY = canvas.height * 5 / 8 - paddleHeight;
    drawRods(lwbY);
    ctx.drawImage(homePlayer, lwbX, lwbY - 15, playerWidth, playerHeight);
    box = new B(new V(lwbX, lwbY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, lwbX);

    var lcmX = paddleX * 3 / 8 + m;
    var lcmY = canvas.height * 5 / 8 - paddleHeight;
    ctx.drawImage(homePlayer, lcmX, lcmY - 15, playerWidth, playerHeight);
    box = new B(new V(lcmX, lcmY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, lcmX);

    var rcmX = paddleX * 5 / 8 + m;
    var rcmY = canvas.height * 5 / 8 - paddleHeight;
    ctx.drawImage(homePlayer, rcmX, rcmY - 15, playerWidth, playerHeight);
    box = new B(new V(rcmX, rcmY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, rcmX);

    var rwbX = paddleX * 7 / 8 + m;
    var rwbY = canvas.height * 5 / 8 - paddleHeight;
    ctx.drawImage(homePlayer, rwbX, rwbY - 15, playerWidth, playerHeight);
    box = new B(new V(rwbX, rwbY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, rwbX);

}

function drawStrikers() {
    //attackers
    var lwX = paddleX / 4 + m;
    var lwY = canvas.height * 9 / 32 - paddleHeight;
    drawRods(lwY);
    ctx.drawImage(homePlayer, lwX, lwY - 15, playerWidth, playerHeight);
    box = new B(new V(lwX, lwY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, lwX);

    var cfX = paddleX / 2 + m;
    var cfY = canvas.height * 9 / 32 - paddleHeight;
    ctx.drawImage(homePlayer, cfX, cfY - 15, playerWidth, playerHeight);
    box = new B(new V(cfX, cfY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, cfX);

    var rwX = paddleX * 3 / 4 + m;
    var rwY = canvas.height * 9 / 32 - paddleHeight;
    ctx.drawImage(homePlayer, rwX, rwY - 15, playerWidth, playerHeight);
    box = new B(new V(rwX, rwY), playerWidth, paddleHeight).toPolygon();
    collisionDetection(box, rwX);

}



function drawAwayGoalkeeper() {

    var gkX = paddleX / 2 + j;
    var gkY = canvas.height * 1 / 8 - paddleHeight;
    drawRods(gkY);
    ctx.drawImage(awayPlayer, gkX, gkY - 15, playerWidth, playerHeight);
    box = new B(new V(gkX, gkY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, gkX);

    if (x > gkX && gkX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (gkX > paddleX * 1 / 4)
        j -= aiSpeed;

}

function drawAwayDefenders() {

    var lcbX = paddleX / 4 + j;
    var lcbY = canvas.height * 3 / 16 - paddleHeight;
    drawRods(lcbY);
    ctx.drawImage(awayPlayer, lcbX, lcbY - 15, playerWidth, playerHeight);
    box = new B(new V(lcbX, lcbY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, lcbX);

    var rcbX = paddleX * 3 / 4 + j;
    var rcbY = canvas.height * 3 / 16 - paddleHeight;
    ctx.drawImage(awayPlayer, rcbX, rcbY - 15, playerWidth, playerHeight);
    box = new B(new V(rcbX, rcbY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, rcbX);

    if (x > lcbX && lcbX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (lcbX > paddleX * 1 / 4)
        j -= aiSpeed;
    if (x > rcbX && rcbX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (rcbX > paddleX * 1 / 4)
        j -= aiSpeed;
}

function drawAwayMidfielders() {

    //midfielders
    var lwbX = paddleX * 1 / 8 + j;
    var lwbY = canvas.height * 3 / 8 - paddleHeight;
    drawRods(lwbY)
    ctx.drawImage(awayPlayer, lwbX, lwbY - 15, playerWidth, playerHeight);
    box = new B(new V(lwbX, lwbY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, lwbX);

    var lcmX = paddleX * 3 / 8 + j;
    var lcmY = canvas.height * 3 / 8 - paddleHeight;
    ctx.drawImage(awayPlayer, lcmX, lcmY - 15, playerWidth, playerHeight);
    box = new B(new V(lcmX, lcmY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, lcmX);

    var rcmX = paddleX * 5 / 8 + j;
    var rcmY = canvas.height * 3 / 8 - paddleHeight;
    ctx.drawImage(awayPlayer, rcmX, rcmY - 15, playerWidth, playerHeight);
    box = new B(new V(rcmX, rcmY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, rcmX);

    var rwbX = paddleX * 7 / 8 + j;
    var rwbY = canvas.height * 3 / 8 - paddleHeight;
    ctx.drawImage(awayPlayer, rwbX, rwbY - 15, playerWidth, playerHeight);
    box = new B(new V(rwbX, rwbY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, rwbX);

    if (x > lwbX && lwbX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (lwbX > paddleX * 1 / 4)
        j -= aiSpeed;
    if (x > rwbX && rwbX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (rwbX > paddleX * 1 / 4)
        j -= aiSpeed;
    if (x > rcmX && rcmX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (rcmX > paddleX * 1 / 4)
        j -= aiSpeed;
    if (x > lcmX && lcmX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (lcmX > paddleX * 1 / 4)
        j -= aiSpeed;
}
function attemptShot(team) {
    if (team === 'home') {
        shotsOnGoalHome += 1; // Increment shots on goal for home team
        // Add logic to determine if the shot is on target, etc.
    } else {
        shotsOnGoalAway += 1; // Increment shots on goal for away team
        // Add logic to determine if the shot is on target, etc.
    }
}
function attemptShot(team) {
    if (team === 'home') {
        shotsOnGoalHome += 1; // Increment shots on goal for home team
        // Add logic to determine if the shot is on target, etc.
    } else {
        shotsOnGoalAway += 1; // Increment shots on goal for away team
        // Add logic to determine if the shot is on target, etc.
    }
}

function drawAwayStrikers() {
    //attackers
    ctx.beginPath();
    var lwX = paddleX / 4 + j;
    var lwY = canvas.height * 23 / 32 - paddleHeight;
    drawRods(lwY);
    ctx.drawImage(awayPlayer, lwX, lwY - 15, playerWidth, playerHeight);
    box = new B(new V(lwX, lwY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, lwX);

    ctx.beginPath();
    var cfX = paddleX / 2 + j;
    var cfY = canvas.height * 23 / 32 - paddleHeight;
    ctx.drawImage(awayPlayer, cfX, cfY - 15, playerWidth, playerHeight);
    box = new B(new V(cfX, cfY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, cfX);

    ctx.beginPath();
    var rwX = paddleX * 3 / 4 + j;
    var rwY = canvas.height * 23 / 32 - paddleHeight;
    ctx.drawImage(awayPlayer, rwX, rwY - 15, playerWidth, playerHeight);
    box = new B(new V(rwX, rwY), playerWidth, paddleHeight).toPolygon();
    collisionDetectionAway(box, rwX);


    // if(y + 10 == rwY || y - 10 == rwY) {
    if (x > lwX && lwX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (lwX > paddleX * 1 / 4)
        j -= aiSpeed;
    if (x > rwX && rwX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (rwX > paddleX * 1 / 4)
        j -= aiSpeed;
    if (x > cfX && cfX < paddleX * 3 / 4)
        j += aiSpeed;
    else if (cfX > paddleX * 1 / 4)
        j -= aiSpeed;
    //}


}


function collisionDetection(box, pX) {
    var response = new SAT.Response();
    if (SAT.testPolygonCircle(box, circle, response)) {
        var speed = (x + (12 / 2) - pX + (20 / 2)) / (20 / 2) * 5;
        if (flag1 == 1) {
            if (dy > 0) {
                dy = -dy;
                y = y - speed;
                if (dx > 0)
                    x = x + speed;
                else
                    x = x - speed;
            } else {
                y = y - speed;
                if (dx > 0)
                    x = x - speed;
                else
                    x = x + speed;
            }
            flag1 = 0;
        }
    } else
        flag1 = 1;
}

function collisionDetectionAway(box, pX) {
    var response = new SAT.Response();
    if (SAT.testPolygonCircle(box, circle, response)) {
        var speed = (x + (12 / 2) - pX + (20 / 2)) / (20 / 2) * 5;
        if (flag2 == 1) {
            if (dy < 0) {
                dy = -dy;
                y = y + speed;
                if (dx > 0)
                    x = x + speed;
                else
                    x = x - speed;
            } else {
                y = y + speed;
                if (dx > 0)
                    x = x + speed;
                else
                    x = x - speed;
            }
        }
    } else
        flag2 = 1;
}


function goalDetection(box) {
    var response = new SAT.Response();
    return SAT.testPolygonCircle(box, circle, response);
}

function drawRods(yAxis) {
    ctx.beginPath();
    ctx.rect(0, yAxis + 2, canvas.width, paddleHeight - 5);
    ctx.fillStyle = "#BDBDBD";
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.closePath();
}

// Helper functions
function resetBall() {
    x = canvas.width / 2;
    y = canvas.height / 2;
    drawBall();
    drawFlag = false;
    window.requestAnimationFrame(draw);
}

function updateStatus(message) {
    document.getElementById('status').innerHTML = message;
}

function removeStatus() {
    setTimeout(function() {
        document.getElementById('status').innerHTML = '';
    }, 1500);
}

function keyDownHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = true;
    } else if (e.keyCode == 37) {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = false;
    } else if (e.keyCode == 37) {
        leftPressed = false;
    }
}
window.onload = function () {
    document.getElementById('play').addEventListener('click', function () {
        document.getElementById('startScreen').style.display = 'none';
        document.querySelector('canvas').style.display = 'block';
    });
};