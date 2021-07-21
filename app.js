const JSONdb = require('simple-json-db');
const WebSocket = require('ws');

const db = new JSONdb('database/participants.json');

const port = 3000



const wss = new WebSocket.Server({port});
const clients = []

wss.on('connection', function connection(ws) {
    clients.push(ws)

    ws.on('message', function incoming(data) {
        try {
            const message = JSON.parse(data)
            switch (message.type) {
                case "ADD":
                    addParticipant(message.dayDateTime, message.shiftIndex, message.name)
                    clients.forEach(client => {
                        if (client !== ws) client.send(JSON.stringify({type: "ADD", ...message}))
                    })
                    break;
                case "DELETE":
                    deleteParticipant(message.dayDateTime, message.shiftIndex, message.name)
                    clients.forEach(client => {
                        if (client !== ws) client.send(JSON.stringify({type: "DELETE", ...message}))
                    })
                    break;
            }
        } catch (e) { }
    })

    ws.addEventListener('close', function close() {
        const index = clients.indexOf(ws)
        if (index !== -1) {
            clients.splice(index, 1)
        }
    })

    ws.send(JSON.stringify({type: "LIST", participants: getParticipantsArray()}))
});

function addParticipant(dayDateTime, shiftIndex, name) {
    if (typeof dayDateTime !== "undefined" &&
        typeof shiftIndex !== "undefined" &&
        typeof name !== "undefined") {

        const dayParticipants = db.get(dayDateTime) || [[], [], [], [], [], [], [], [], []]
        dayParticipants[shiftIndex].push(name);
        db.set(dayDateTime, dayParticipants);
    }
}

function deleteParticipant(dayDateTime, shiftIndex, name) {
    if (typeof dayDateTime !== "undefined" &&
        typeof shiftIndex !== "undefined" &&
        typeof name !== "undefined") {

        const dayParticipants = db.get(dayDateTime)
        if (dayParticipants !== undefined) {
            const index = dayParticipants[shiftIndex].indexOf(name);
            if (index !== -1) {
                dayParticipants[shiftIndex].splice(index, 1);
                db.set(dayDateTime, dayParticipants)
            }
        }
    }
}

function getCurrentDayTimestamp() {
    return Math.floor(Date.now() / 86400000) * 86400000
}

function getParticipantsArray() {
    const participantsArray = []

    for (i = -1; i < 10; i++) {
        const dayDateTime = getCurrentDayTimestamp() + i * 86400000
        participantsArray.push({
            dayDateTime,
            participants: db.get(dayDateTime) || [[], [], [], [], [], [], [], [], []]
        })
    }

    return participantsArray
}
