# Timers for a bridge game tournament
In order to setup the application, a Firebase Realtime Database must first be created. Information on how to do this can be found at https://firebase.google.com/docs/database/web/start.
The configuration file must also be edited in both main-master.js and main-follower.js. Information on how to find the configuration file can be found at https://firebase.google.com/docs/web/setup.
To enable logging, the LOGGING_ENABLED global variable must be set to true. This will enable console logs that will display messages each time the follower time is updated and the calibration interval on the master.
The database must contain the following elements, case sensitive:
  "CALIBVAL_MAX",
  "FLAG",
  "STAGE",
  "START_VAL",
  "STATUS",
  "TIME_DB",
  "TIME_LEFT
In order to start the application, some form of server must be started. This application used http-server and recommends it. A guide on how to use http-server can be found at https://github.com/http-party/http-server.
The follower files can be uploaded to a server of choice. For best performance it is recommended to use Firebase’s own hosting, which is also what this project used. A guide on setting up a Firebase server can be found at https://firebase.google.com/docs/hosting.
