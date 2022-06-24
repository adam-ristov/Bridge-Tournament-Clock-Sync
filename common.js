import { initializeApp } from "https://www.gstatic.com/firebasejs/9.7.0/firebase-app.js"
import {
  getDatabase,
  ref,
  get,
  serverTimestamp,
  update,
} from "https://www.gstatic.com/firebasejs/9.7.0/firebase-database.js"

const firebaseConfig = {
  apiKey: "AIzaSyBpY_fzzcVe5f2y9H9SGG43MoroTVjKy1E",
  authDomain: "test0-e5970.firebaseapp.com",
  databaseURL: "https://test0-e5970-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "test0-e5970",
  storageBucket: "test0-e5970.appspot.com",
  messagingSenderId: "567866234592",
  appId: "1:567866234592:web:872a30531e8bf6209ee285",
  measurementId: "G-81087NY9NG"
}
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const dbRef = ref(db)

export async function getAllVals(){
  const reference = await get(dbRef)
  let timerStartVal = reference.val().START_VAL
  let timeLeft = reference.val().TIME_LEFT
  let stage = reference.val().STAGE
  let status = reference.val().STATUS
  return [timerStartVal,timeLeft,stage,status]
}
export async function getInitTime(){
  let timerRef = await get(dbRef)
  let timerStartVal = timerRef.val().START_VAL
  return timerStartVal
}

export async function getTimeLeft(){
  let timerRef = await get(dbRef)
  let timeLeft = timerRef.val().TIME_LEFT
  return timeLeft
}

export async function getStage(){
  let stageRef = await get(dbRef)
  let stage = stageRef.val().STAGE
  return stage
}

export async function getStatus(){
  let statusRef = await get(dbRef)
  let status = statusRef.val().STATUS
  return status
}

export function setFlag(flag){
  update(dbRef,{
    FLAG:flag
  })
}

async function getTime(){
    const serverTime = await get(dbRef)
    var serverTimeVal = serverTime.val()
    return serverTimeVal.TIME_DB
}

function sendTime(timeVal = serverTimestamp()){
  update(dbRef,{
    TIME_DB:timeVal
  })
}

export function sendCalibVal(CalibVal){
  update(dbRef,{
    CALIBVAL_MAX: CalibVal
  })
}

export function Calibration(LOGGING_ENABLED){
  var calibrationArr = []

  this.calcAvgDiff = function(){
    calibrationArr[0] = 0
    var sum = calibrationArr.reduce((a,b)=> a+b,0)
    var CalibVal = parseInt(sum/calibrationArr.length)
    if(LOGGING_ENABLED)
      console.log("CALIBRATION VALUE = " + CalibVal)
    return CalibVal
  }

  this.start = async function (){
    const endCalibration = Date.now() + 2500
    var dbTime, sysTime = 0
    sendCalibVal(0)
    while(sysTime <= endCalibration){
        sysTime = Date.now()
        sendTime()
        dbTime = await getTime()
        calibrationArr.push(Math.abs(sysTime - dbTime))
    }
    const CalibVal = this.calcAvgDiff()
    return CalibVal
  }
}