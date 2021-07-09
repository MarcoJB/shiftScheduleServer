const express = require('express')
const bodyParser = require('body-parser');
const JSONdb = require('simple-json-db');

const db = new JSONdb('database/participants.json');

const port = 3000

const app = express()
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/participants', (req, res) => {
    res.send(getParticipantsArray())
})

app.post("/participants", (req, res) => {
    if (typeof req.body.dayDateTime !== "undefined" &&
        typeof req.body.shiftIndex !== "undefined" &&
        typeof req.body.name !== "undefined") {

        const dayParticipants = db.get(req.body.dayDateTime) || [[], [], [], [], [], [], [], [], []]
        dayParticipants[req.body.shiftIndex].push(req.body.name);
        db.set(req.body.dayDateTime, dayParticipants);

    }

    res.send(getParticipantsArray())
})

app.delete("/participants/:dayDateTime/:shiftIndex/:name", (req, res) => {
    const dayParticipants = db.get(req.params.dayDateTime)
    if (dayParticipants !== undefined) {
        const index = dayParticipants[req.params.shiftIndex].indexOf(req.params.name);
        if (index !== -1) {
            dayParticipants[req.params.shiftIndex].splice(index, 1);
            db.set(req.params.dayDateTime, dayParticipants)
        }
    }
    res.send(getParticipantsArray())
})

app.listen(port, () => {
    console.log(`Shift schedule server listening on port ${port}`)
})

function getCurrentDayDate() {
    const currentDayDate = new Date()
    currentDayDate.setHours(0, 0, 0, 0)
    return currentDayDate;
}

function getParticipantsArray() {
    const participantsArray = []

    for (i = -1; i < 10; i++) {
        const dayDateTime = getCurrentDayDate().getTime() + i * 86400000
        participantsArray.push({
            dayDateTime,
            participants: db.get(dayDateTime) || [[], [], [], [], [], [], [], [], []]
        })
    }

    return participantsArray
}
