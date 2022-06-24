import {getInitTime} from '/common.js'

const FULL_DASH_ARRAY = 283;
var INIT_TIME = await getInitTime()
var WARNING_THRESHOLD = parseInt(0.3*INIT_TIME);
var ALERT_THRESHOLD = parseInt(0.1*INIT_TIME);
var timeLeft = INIT_TIME
var COLOR_CODES = {
    info: {
        color: "green"
    },
    warning: {
        color: "orange",
        threshold: WARNING_THRESHOLD
    },
    alert: {
        color: "red",
        threshold: ALERT_THRESHOLD
    }
};
let remainingPathColor = COLOR_CODES.info.color;

document.getElementById("app").innerHTML = `
<div class="base-timer">
  <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="base-timer__circle">
      <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
      <path
        id="base-timer-path-remaining"
        stroke="283"
        class="base-timer__path-remaining ${remainingPathColor}"
        d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
        "
      ></path>
    </g>
  </svg>
  <span id="base-timer-label" class="base-timer__label">${formatTime(
    timeLeft
  )}</span>
</div>
`;

export async function resetTimerVisually(timer_length){
    INIT_TIME = timer_length
    WARNING_THRESHOLD = parseInt(0.3*INIT_TIME);
    ALERT_THRESHOLD = parseInt(0.1*INIT_TIME);
    COLOR_CODES = {
        info: {
            color: "green"
        },
        warning: {
            color: "orange",
            threshold: WARNING_THRESHOLD
        },
        alert: {
            color: "red",
            threshold: ALERT_THRESHOLD
        }
    };
    setRemainingPathColor(INIT_TIME)
    document.getElementById("base-timer-label").innerHTML = formatTime(
      timer_length
    );
}

export function dispText(text, change = true){
  let textToDisp = ''
  if(text == "ROUND_IN_PROGRESS"){
    textToDisp = 'ROUND IN PROGRESS'
  }
  else if(text == "PAUSE_ADMIN"){
    textToDisp = "ROUND PAUSED BY ADMIN"
  }
  else if(text == "SWITCH_IN_PROGRESS"){
    textToDisp = 'SWITCH TIMER IN PROGRESS, PLEASE SWITCH TABLES'
  }
  else if(text == "PAUSE_IN_PROGRESS"){
    textToDisp = 'BREAK TIME!'
  }
  else if(text == "FINISHED"){
    textToDisp = "TOURNAMENT HAS FINISHED"
  }
  else if(text == "CALIBRATION_START"){
    textToDisp = "CALIBRATING THE TIMER, PLEASE HOLD ON"
  }
  else if(text == "CALIBRATION_END"){
    textToDisp = "CALIBRATION DONE, TIMER PAUSED"
  }
  else if(text == "TOURNAMENT_RESET"){
    textToDisp = "TOURNAMENT HAS BEEN RESET"
  }
  if(change)
    $('#textSpan').text(textToDisp)
}

export function dispSettings(roundNum, roundsLeft, breakRound, roundLength, breakLength, switchLength){
  document.getElementById('settingsInfo').innerHTML = `
                          <p>Number of rounds: ${roundNum}</p>
                          <p>Rounds left: ${roundsLeft + 1}</p>
                          <p>Break after round: ${breakRound}</p>
                          <p>Round length: ${roundLength/1000}s</p>
                          <p>Break length: ${breakLength/1000}s</p>
                          <p>Switch length: ${switchLength/1000}s</p>`
}


export function dispTimer(time_left, timer_length,text_to_disp){
    dispText(text_to_disp)
    timeLeft = time_left
    INIT_TIME = timer_length
    document.getElementById("base-timer-label").innerHTML = formatTime(
        timeLeft
      );
    setCircleDasharray()
    setRemainingPathColor(timeLeft)
}

function formatTime(time) {
    var seconds = time/1000
    var minutes = parseInt(seconds/60)
    var dispSeconds = (seconds % 60).toFixed(0)
    return `${minutes}:${dispSeconds}`
}

function setRemainingPathColor(timeLeft) {
  const { alert, warning, info } = COLOR_CODES;

  if (timeLeft <= alert.threshold) {
    document
        .getElementById("base-timer-path-remaining")
        .classList.remove(warning.color);
    document
        .getElementById("base-timer-path-remaining")
        .classList.add(alert.color);
  } else if (timeLeft <= warning.threshold) {
    document
        .getElementById("base-timer-path-remaining")
        .classList.remove(info.color);
    document
        .getElementById("base-timer-path-remaining")
        .classList.add(warning.color);
  } else{
    document
        .getElementById("base-timer-path-remaining")
        .classList.remove(warning.color);
    document
        .getElementById("base-timer-path-remaining")
        .classList.remove(alert.color);
    document
        .getElementById("base-timer-path-remaining")
        .classList.add(info.color);
  }
}

function calculateTimeFraction() {
  const rawTimeFraction = timeLeft / INIT_TIME;
  return rawTimeFraction - (1 / INIT_TIME) * (1 - rawTimeFraction);
}


function setCircleDasharray() {
    const circleDasharray = `${(
        calculateTimeFraction() * FULL_DASH_ARRAY
        ).toFixed(0)} 283`;
        document
        .getElementById("base-timer-path-remaining")
        .setAttribute("stroke-dasharray", circleDasharray);
  }
  