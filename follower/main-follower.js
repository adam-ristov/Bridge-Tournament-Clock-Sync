import {Calibration, getInitTime, sendCalibVal, getAllVals, setFlag} from "/common.js"
import {dispTimer, resetTimerVisually, dispText} from '/visuals.js'
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.7.0/firebase-app.js"
import {getDatabase, ref, onValue,} from "https://www.gstatic.com/firebasejs/9.7.0/firebase-database.js"

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

//Constants
const app = initializeApp(firebaseConfig)
const statusRef = ref(getDatabase(app),'STATUS')
const timeLeftRef = ref(getDatabase(app),'TIME_LEFT')
const CalibValMaxRef = ref(getDatabase(app),'CALIBVAL_MAX')
const stageRef = ref(getDatabase(app),'STAGE')
const startValRef = ref(getDatabase(app),'START_VAL')
const TIMER_ACCURACY = 10 //in ms
const LOGGING_ENABLED = true;

//Global variables
var TIMER_LENGTH = await getInitTime() //in ms
var timer = new Timer(displayVisuals,TIMER_ACCURACY)
var CALIB_VAL = 0
var TIME_LEFT
var tournamentStage = ""

function Timer(workFunc, interval) {
    var that = this
    this.interval = interval

    this.start = function(init = false) {
        that.expected = Date.now() + this.interval
        if(!that.difference){ // If timer has been reset
            that.endTime = that.expected + TIMER_LENGTH
        }
        else{
            that.endTime = that.expected + that.difference 
        }
        that.timeout = setTimeout(step, this.interval)
    }

    this.adjustTimer = function(){
        if(LOGGING_ENABLED)
            console.log("TIMER ADJUSTED, CLOCK DIFFERENCE: ",(that.endTime - that.expected) - TIME_LEFT)
        that.endTime = that.expected + TIME_LEFT
      }
      
    this.stop = function(reset = false) {
        clearTimeout(that.timeout)
        if(!reset){
            that.difference = TIME_LEFT
            if(TIME_LEFT == 0)
                TIME_LEFT = TIMER_LENGTH
            workFunc(TIME_LEFT,0)
        }
        else{
            that.difference = false
            workFunc(TIMER_LENGTH,0)
        }
    }
  
    function step() {
        var drift = Date.now() - that.expected
        if((that.endTime - that.expected) > 0 && tournamentStage != "PAUSE_ADMIN"){
            workFunc(that.endTime,that.expected)
            that.expected += that.interval
            that.timeout = setTimeout(step, that.interval-drift)
        }
        else{
            workFunc(0,0)
        }
    }
}   

function displayVisuals(endTime, expectedTime){
    const diff = endTime - expectedTime
    dispTimer(diff,TIMER_LENGTH,tournamentStage)
}

async function getCalibVal(){
    dispText("CALIBRATION_START")
    var calibration = new Calibration()
    CALIB_VAL = await calibration.start()
    dispText("CALIBRATION_END")
}

async function setInitTime(){
    const startVal = await getInitTime()
    TIMER_LENGTH = startVal
}


function updateStage(stage){
    tournamentStage = stage
}

async function init(){
    setFlag(1)
    const dbVals = await getAllVals()
    const timerStartVal = dbVals[0],
          timeLeft = dbVals[1],
          stage = dbVals[2],
          status = dbVals[3]
    TIMER_LENGTH = timerStartVal
    TIME_LEFT = timeLeft
    tournamentStage = stage
    statusSelector(status)
}

function statusSelector(statusVal){
    if(statusVal == "CALIBRATING"){
        getCalibVal()
    }
    else if(statusVal == "RUNNING"){
        timer.start()
    }
    else if(statusVal == "PAUSED"){
        timer.stop(false)
    }
    else if(statusVal == "RESET"){
        timer.stop(true)
    }
    else if(statusVal == "TIMER_INIT"){
        setInitTime()
        timer.stop(true)
    }
}

onValue(statusRef,(snapshot) => {
    const statusVal = snapshot.val()  
    statusSelector(statusVal)
})

onValue(timeLeftRef,(snapshot)=>{
    const timeLeftVal = snapshot.val()
    if(timeLeftVal != TIME_LEFT){
        TIME_LEFT = timeLeftVal
        timer.adjustTimer()
    }
})

onValue(CalibValMaxRef, (snapshot)=>{
    const CalibValMaxDB = snapshot.val()
    if(CALIB_VAL > CalibValMaxDB){
        sendCalibVal(CALIB_VAL)
    }
})

onValue(stageRef, (snapshot)=>{
    const DBStage = snapshot.val()
    updateStage(DBStage)
})

onValue(startValRef, (snapshot)=>{
    const startVal = snapshot.val()
    if(TIMER_LENGTH != startVal){
        TIMER_LENGTH = startVal
        resetTimerVisually(TIMER_LENGTH)
    }
})
timer.stop(true)
init()
