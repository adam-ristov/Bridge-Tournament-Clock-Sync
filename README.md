# Timers for a bridge game tournament
In order to setup the application, a Firebase Realtime Database must first be created. Information on how to do this can be found at https://firebase.google.com/docs/database/web/start.<br><br>
The configuration file must also be edited in both <code>main-master.js</code> and <code>main-follower.js</code>. Information on how to find the configuration file can be found at https://firebase.google.com/docs/web/setup.<br><br>
To enable logging, the <code>LOGGING_ENABLED</code> global variable must be set to <code>true</code>. This will enable console logs that will display messages each time the follower time is updated and the calibration interval on the master.<br><br>
The database must contain the following elements, case sensitive:<br><br>
<code>"CALIBVAL_MAX",<br>
  "FLAG",<br>
  "STAGE",<br>
  "START_VAL",<br>
  "STATUS",<br>
  "TIME_DB",<br>
  "TIME_LEFT"<br></code><br>
In order to start the application, some form of server must be started. This application used http-server and recommends it. A guide on how to use http-server can be found at https://github.com/http-party/http-server.<br><br>
The follower files can be uploaded to a server of choice. For best performance it is recommended to use Firebase’s own hosting, which is also what this project used. A guide on setting up a Firebase server can be found at https://firebase.google.com/docs/hosting.
