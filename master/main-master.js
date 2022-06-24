import {Calibration, sendCalibVal, setFlag} from '/common.js'
import {dispTimer, resetTimerVisually, dispText, dispSettings} from '/visuals.js'
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.7.0/firebase-app.js"
import {getDatabase, ref, update, onValue} from "https://www.gstatic.com/firebasejs/9.7.0/firebase-database.js"

const firebaseConfig = {
  // apiKey: "...",
  // authDomain: "...",
  // databaseURL: "...",
  // projectId: "...",
  // storageBucket: "...",
  // messagingSenderId: "...",
  // appId: "...",
  // measurementId: "..."

  //THIS NEEDS TO BE CHANGED BY THE USER
  //THE FIREBASE SETUP GUIDE CAN BE FOUND AT
  //https://firebase.google.com/docs/web/setup
}

// Constant values
const app = initializeApp(firebaseConfig)
const dbRef = ref(getDatabase(app))
const CalibValMaxRef = ref(getDatabase(app),'CALIBVAL_MAX')
const flagRef = ref(getDatabase(app),'FLAG')
const LOGGING_ENABLED = true;
const TIMER_ACCURACY = 10           //in milliseconds

// Global variables
var TIMER_LENGTH = 1800000          //30 minutes in milliseconds
var UPDATE_DELAY = 0
var CURR_TIMER_STATUS = ""
var TIME_LEFT
var timer = new Timer(displayVisuals,TIMER_ACCURACY)

// Bridge game tournament settings
var numRounds = 6
var numRoundsLeft = numRounds - 1
var initTIMER_LENGTH = TIMER_LENGTH
var breakTime = 300000              // 5 minutes in milliseconds
var switchTime = 60000              // 1 minutes in milliseconds
var tournamentStage = ""
var breakRound = parseInt(numRounds/2)
var initBreakRound = breakRound
var oldTournamentStage = ""

// Checks all possible states of the timer where it could be paused
function isTimerPaused(){
  if(CURR_TIMER_STATUS == "PAUSED" || CURR_TIMER_STATUS =="CALIBRATION_DONE" || CURR_TIMER_STATUS == "TIMER_INIT")
    return true
  return false
}

function updateSettingsInfo(){
  dispSettings(numRounds, numRoundsLeft, breakRound, TIMER_LENGTH, breakTime, switchTime)
}

function setnumRounds(){
  numRounds = getIntegerInput("Input the number of rounds to be played")
  numRoundsLeft = numRounds - 1
  updateSettingsInfo()
}

function setBreakRound(){
  breakRound = getIntegerInput("Input the round after which the break should occur\
  (E.x. If you want the break to occur after the second round then input 2)\nInput -1 for no break")
  initBreakRound = breakRound
  updateSettingsInfo()
}

function setroundTime(){
  sendTimeLeft(TIMER_LENGTH)
  setTimerVal("round")
  resetTimerVisually(TIMER_LENGTH)
  sendStatus(CURR_TIMER_STATUS)
  sendTimeLeft(TIMER_LENGTH)
  updateSettingsInfo()
}

function setBreakTime(){
  setTimerVal("break")
  updateSettingsInfo()
}

function setSwitchTime(){
  setTimerVal("switch")
  updateSettingsInfo()
}

// Checks if the input from the user is an integer
function getIntegerInput(text){
  let value = parseInt(prompt(text))
  if(!Number.isInteger(value) || isNaN(value)){
    return getIntegerInput(text)
  }
  else{
    return value
  }
}

function nextTournamentStage(){
  if(numRoundsLeft == breakRound){      //Break round logic
    TIMER_LENGTH = breakTime
    breakRound = -1
    timer.stop()
    tournamentStage = "PAUSE_IN_PROGRESS"
    resetTimerVisually(TIMER_LENGTH)
    timer = new Timer(displayVisuals,TIMER_ACCURACY)
    timer.start(true)
  }
  else if(numRoundsLeft == 0){          //Tournament finished logic
    tournamentStage = "FINISHED"
    TIMER_LENGTH = 0
    sendTimeLeft(0)
    timer.stop()
  }
  else if(tournamentStage == "ROUND_IN_PROGRESS"){
    TIMER_LENGTH = switchTime             //Switch round logic
    timer.stop()
    tournamentStage = "SWITCH_IN_PROGRESS"
    resetTimerVisually(TIMER_LENGTH)
    timer = new Timer(displayVisuals,TIMER_ACCURACY)
    timer.start(true)
  }       
  else{                                   //Playing round logic
    timer.stop()  
    tournamentStage = "ROUND_IN_PROGRESS"
    numRoundsLeft -= 1
    resetTimerVisually(TIMER_LENGTH)
    timer = new Timer(displayVisuals,TIMER_ACCURACY)
    timer.start(true)
  }
  updateSettingsInfo()
}

//Sends the current status of the timer to the DB
function sendStatus(status){
  update(dbRef,{
    STATUS: status,
    STAGE: tournamentStage,
    START_VAL: TIMER_LENGTH
  })
  CURR_TIMER_STATUS = status
}

function sendStartVal(val){
  update(dbRef,{
    START_VAL: val
  })
}

function sendTimeLeft(timeLeft){
  if(!isNaN(timeLeft)){
    update(dbRef,{
      TIME_LEFT: timeLeft,
    })
  }
}

//Does the HTML visuals
function displayVisuals(endTime, expectedTime){
  const diff = endTime - expectedTime
  dispTimer(diff,TIMER_LENGTH,tournamentStage)
  if(diff % UPDATE_DELAY == 0 && tournamentStage != "FINISHED"){
    sendTimeLeft(diff)
  }
  TIME_LEFT = diff
}

//Starts a calibration cycle
async function startCalibration(){
  sendStatus("CALIBRATING")
  dispText("CALIBRATION_START")
  var calibration = new Calibration(LOGGING_ENABLED)
  let calibrationVal = await calibration.start()
  sendCalibVal(calibrationVal)
  sendStatus("CALIBRATION_DONE") 
  dispText("CALIBRATION_END")
}

//Timer for the master
function Timer(workFunc, interval) {
  var that = this
  this.interval = interval
  
  this.start = function(msgSet = false){ 
    if(!msgSet){                            //If the stage was not initialized
      tournamentStage = "ROUND_IN_PROGRESS"    
    }                                 
    that.expected = Date.now() + this.interval                
    if(that.difference){                    //If the timer was paused
      tournamentStage = oldTournamentStage                                     
      that.endTime = that.expected + that.difference
    }
    else{
      that.endTime = that.expected + TIMER_LENGTH
      sendTimeLeft(TIMER_LENGTH)           
    }
  sendStatus("RUNNING")
  that.timeout = setTimeout(step, this.interval)
  }

  this.init = function(){
    sendCalibVal(0)
    numRoundsLeft = numRounds - 1
    TIMER_LENGTH = initTIMER_LENGTH
    breakRound = initBreakRound
    sendStatus("RESET")
    sendTimeLeft(TIMER_LENGTH)
    resetTimerVisually(TIMER_LENGTH)
    updateSettingsInfo()
    sendStatus("PAUSED")
    workFunc(TIMER_LENGTH,0)
  }

  this.stop = function(reset = false){ 
    clearTimeout(that.timeout)
    if(reset){
      that.difference = false
      tournamentStage = "TOURNAMENT_RESET"
      this.init()
    }
    if(tournamentStage == "FINISHED"){
      workFunc(that.endTime,that.expected)
      sendStatus("PAUSED")
    }
    else if(!reset){                            //If the timer was paused
      that.difference = that.endTime - that.expected
      sendTimeLeft(that.difference)
      oldTournamentStage = tournamentStage
      tournamentStage = "PAUSE_ADMIN"
      sendStatus("PAUSED")
      workFunc(that.endTime,that.expected)
    }  
  }

  function step(){     
    var drift = (Date.now()) - that.expected 
    if((that.endTime - that.expected) > 0){
      workFunc(that.endTime,that.expected)
      that.expected += that.interval
      that.timeout = setTimeout(step, that.interval-drift)
    }
    else{
      nextTournamentStage()
    }
    
  }
}

function setTimerVal(type,retry = false){
  sendStatus("PAUSED")
  var extraMsg = ""

  if(retry){
    extraMsg = "Please follow the instructions\n"
  }

  let timerVal = prompt(extraMsg + 'Enter timer value in the format "M.S" where M is minutes and S is seconds')
  let splitted = timerVal.split('.')
  var mins = splitted[0]
  var secs = splitted[1]
  let timeConversion = secs*1000+mins*60000
  if(isNaN(timeConversion)){
      setTimerVal(type,true)
  }
  if(type == "round"){
    TIMER_LENGTH = timeConversion
    initTIMER_LENGTH = TIMER_LENGTH
    sendStartVal(TIMER_LENGTH)
    timer.stop(true)
    sendStatus("TIMER_INIT")  
  }
  else if(type == "break"){
    breakTime = timeConversion
  }
  else{
    switchTime = timeConversion
  }
}

//Async functions

//Get the highest calibration value from the followers
onValue(CalibValMaxRef, (snapshot)=>{
  const CalibValValInput = snapshot.val()
  const valTransform = 0.03683*CalibValValInput - 16.3758
  if(valTransform <= 0){return}
  const valToSeconds = (valTransform/10)/1000     //JS trick to round
  UPDATE_DELAY = Math.round(1/valToSeconds)*1000  //up to nearest second
  if(LOGGING_ENABLED)
    console.log("UPDATE_DELAY = " + UPDATE_DELAY)
})

//A flag is set everytime a new connection appears to the database. This is done to 
//make sure the new connection is initially synchronized to the master
onValue(flagRef,(snapshot) => {
  const flagVal = snapshot.val()  
  if(flagVal == 1){
    if(LOGGING_ENABLED)
      console.log("flag raised")
    sendTimeLeft(TIME_LEFT)
    setFlag(0)
  }
})

timer.init()
updateSettingsInfo()

document.querySelector('#pause').addEventListener('click', () => {if(!isTimerPaused()) timer.stop()})
document.querySelector('#start').addEventListener('click', () => {if(isTimerPaused()) timer.start()})
document.querySelector('#calibrate').addEventListener('click',() =>{if(isTimerPaused()) startCalibration()})
document.querySelector('#reset').addEventListener('click', () => {timer.stop(true)})

document.querySelector('#numRounds').addEventListener('click', () => setnumRounds())
document.querySelector('#timeRound').addEventListener('click', () => setroundTime())
document.querySelector('#timeBreak').addEventListener('click', () => setBreakTime())
document.querySelector('#timeSwitch').addEventListener('click', () => setSwitchTime())
document.querySelector('#breakRound').addEventListener('click', () => setBreakRound())