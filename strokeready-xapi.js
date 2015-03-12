
var tincan = new TinCan({
	recordStores: [{
                endpoint: "[endpoint]",
                auth: "[Basic Base64 auth]",
                allowFail: false
    }],
	context: {	registration: "[]",
				platform: deviceName
	}
});

TinCan.DEBUG = true;

// Get ISO timestamp
// ----------------------------//
function getTimestamp() {
	date = new Date();
	ISOtimestamp = date.toISOString();
}

// Start Time Stmt
// -----------------------------------------------------------//
function sendStartTimeStmt() {
	getTimestamp();
	startTime = moment(date).format('MMMM Do YYYY, h:mm:ss a');
	localStorage["startTime - " + username] = ISOtimestamp;
	var	xAPIstartTime = {
			actor: {	name: username,
						mbox: "mailto:" + email
			},
			verb: {		id: "http://adlnet.gov/expapi/verbs/launched",
						display: {und: "launched"}
			},
			target: {	id: "http://www.uofmhealth.org/medical-services/stroke/startTime",
						definition: {
							name: {und: "Stroke Ready App at " + date},
							description: {und: startTime},
							type: "http://activitystrea.ms/schema/1.0/application"
						}
			},
			result: {completion: true},
			timestamp: 	ISOtimestamp
		},
	startTimeString = JSON.stringify(xAPIstartTime);
	localStorage["xAPIstmt-Start-Time - " + username] = startTimeString;
}

// Guide Choice Stmt
// ---------------------------------------------------------///
function guideChoiceStmt() {
	getTimestamp();

	guideID = localStorage.getItem("Guide Choice ID - " + username);
	switch (guideID) {
		case "guide1": 	
		case "guide2": 	guideDescr = "Hispanic"; break;
		case "guide3":
		case "guide4": 	guideDescr = "Mixed Race"; break;
		case "guide5":
		case "guide6": 	guideDescr = "African-American"; break;
		case "guide7":
		case "guide8": 	guideDescr = "Caucasian"; break;
	}
	
	var guideGenderLowerCase = localStorage.getItem("Voice Gender"),
	guideGender = guideGenderLowerCase[0].toUpperCase() + guideGenderLowerCase.substring(1);
	
	var	xAPIguideChoice = {
			actor: {	name: username,
						mbox: "mailto:" + email
			},
			verb: {		id: "http://adlnet.gov/expapi/verbs/experienced",
						display: {und: "chose"}
			},
			target: {	id: "http://www.uofmhealth.org/medical-services/stroke/guideID",
						definition: {
							name: {und: guideID},
							description: {und: guideDescr},
							type: "http://activitystrea.ms/schema/1.0/application"
						}
			},
			result: {	completion: true,
					  	extensions: {
							"http://www.uofmhealth.org": {
								"gender": guideGender
							}
						}
			},			
			timestamp: 	ISOtimestamp
		},
	guideChoiceString = JSON.stringify(xAPIguideChoice);
	localStorage["xAPIstmt-Guide-Choice - " + username] = guideChoiceString;
}

// Tin Can statementS sent to LRS and localStorage cleared
// -------------------------------------------->>>>>>
var i, tincanStmtsString, tincanStmtsJSON, userCountVar, tincanStmtsArray = [], storageLength = localStorage.length, err, xhr;

function sendAllStatements() {
	sendQueuedStatements();
	storageLength = localStorage.length;
	for (var i = storageLength-1; i >= 0; i--){
		if (localStorage.key(i).indexOf("xAPIstmt") >= 0) {
			tincanStmtsString = localStorage.getItem(localStorage.key(i));
			tincanStmtsJSON = JSON.parse(tincanStmtsString);
			tincanStmtsArray.push(tincanStmtsJSON);
			console.log(i + " of " + storageLength + " added to array - " + localStorage.key(i));
			localStorage.removeItem(localStorage.key(i));
		}
	}
	tincan.sendStatements(tincanStmtsArray, oneArrayCallback);
}

function oneArrayCallback(statusResults,finalStmt) {
	var sentStatus = statusResults[0].xhr.status;
	if (sentStatus === 0 || sentStatus === 400) {
		console.log("FAIL: sentStatus = " + sentStatus);
		clearAllStorageSaveArrays();
		tincanStmtsArrayString = JSON.stringify(tincanStmtsArray);
		localStorage.setItem("xAPIarray - " + username, tincanStmtsArrayString);
	}
	else {
		console.log("SUCCESS: sentStatus  = " + sentStatus);
		clearAllStorage();
	};
	//console.log(finalStmt);
}

function sendQueuedStatements() {
	storageLength = localStorage.length;
	for (var i = storageLength-1; i >= 0; i--){
		if (localStorage.key(i).indexOf("xAPIarray") >= 0) {
			tincanArrayString = localStorage.getItem(localStorage.key(i));
			tincanArrayJSON = JSON.parse(tincanArrayString);
			tincan.sendStatements(tincanArrayJSON, queuedArrayCallback);
		}
	}
}

function queuedArrayCallback(statusResults,finalStmt) {
	userCountVar=localStorage.getItem("userCount");
	var sentStatus = statusResults[0].xhr.status;
	if (sentStatus === 0 || sentStatus === 400) {
		console.log("FAILED TO SEND QUEUED ARRAYS: sentStatus = " + sentStatus);
	}
	else {
		console.log("SUCCESSFULLY SENT QUEUED ARRAY: sentStatus  = " + sentStatus);
		localStorage.removeItem(localStorage.key(i));
	};
	localStorage.userCount=userCountVar;
}

function clearAllStorageSaveArrays() {
	storageLength = localStorage.length;
	userCountVar=localStorage.getItem("userCount");
	deviceID=localStorage.getItem("deviceID");
	for (var i = storageLength-1; i >= 0; i--){
		if (localStorage.key(i).indexOf("xAPIarray") >= 0) {
			console.log("Array saved from deletion = " + localStorage.key(i));
		}
		else {
			localStorage.removeItem(localStorage.key(i));
		}
	}
	localStorage.userCount=userCountVar;
	localStorage.deviceID=deviceID;
}

function clearAllStorage() {
	userCountVar=localStorage.getItem("userCount");
	deviceID=localStorage.getItem("deviceID");
	localStorage.clear();
	console.log("Storage cleared, except for userCount and deviceID");
	localStorage.userCount=userCountVar;
	localStorage.deviceID=deviceID;
}