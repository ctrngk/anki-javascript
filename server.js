const express = require('express')
const next = require('next')
const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({dev})
const handle = app.getRequestHandler()
// req.body should not return undefined. To get express to populate req.body
const bodyParser = require('body-parser')


// integrate json-server with express server
// https://github.com/typicode/json-server/issues/253
const jsonServer = require('json-server');
const axios = require('axios')
// https://github.com/axios/axios/issues/187#issuecomment-169878665
const axios_instance = axios.create({baseURL: 'http://localhost:3000'})


const fs = require('fs')
const Card = require('./utils/alg')
const LoadCard = require('./utils/load')


app.prepare().then(() => {
    const server = express()
    server.use(bodyParser.urlencoded({extended: true}))
    server.use(bodyParser.json())

    // With json-server, create api server (/json-api/cards) for local json file
    server.use('/json-api', jsonServer.router('./data/deck.json'))

    server.post('/anki', async (req, res) => {
        console.log("req.query", req.query)
        let button = req.query.button
        let id = Number(req.query.id)
        if (!button || !id) {
            throw new Error()
        }
        console.log(`button ${button} detected, you're posting`, req.url)
        // 1. Create Memory
        // 2. Load fileData to Memory
        // 3. changing Memory by clicking object
        // 4. Save Memory to fileData
        // ===================================
        const cardMemory = new LoadCard()
        // 2. load fileData to Memory
        await cardMemory.load(id)
        cardMemory.status = cardMemory.json.class.status
        cardMemory.steps_index = cardMemory.json.class.steps_index
        cardMemory.ease_factor = cardMemory.json.class.ease_factor
        cardMemory.interval = cardMemory.json.class.interval
        cardMemory.history = cardMemory.json.class.history
        const next_time = cardMemory.prompt()[`${button}_ivl`] * 1440 // mins
        // 3. changing Memory by clicking object
        cardMemory.choice(button)
        const prompt = cardMemory.prompt()
        Object.keys(prompt).forEach(x => prompt[x] === undefined && delete prompt[x]) // remove undefined
        // 4. Save Memory to fileData
        console.log("saving memory to fileData")
        let dall = await axios_instance.get(`/json-api/cards?id=${id}`)
        let djson = await dall.data[0]
        let d = new Date()
        let v = new Date()
        v.setMinutes(d.getMinutes() + next_time)
        djson.schedule.access.push(d.toJSON())
        const countbyday = next_time >= 1440
        djson.schedule.due.push({"time": v.toJSON(), countbyday})
        let sts = await axios_instance.patch(`/json-api/cards/${id}`, {
            "schedule": {
                "access": djson.schedule.access,
                "due": djson.schedule.due
            },
            "class": {
                "history": cardMemory.history,
                "status": cardMemory.status,
                "steps_index": cardMemory.steps_index,
                "ease_factor": cardMemory.ease_factor,
                "interval": cardMemory.interval
            }
        })
        console.log("saved successfully")
        res.json({"status": "ok"})
    })

    server.get('/anki', async (req, res) => {
        console.log(`you're visiting`, req.url)
        let deckALL = await axios_instance.get(`/json-api/cards`)
        const deckJSON = await deckALL.data
            // [
            //  {"id":1,"schedule":{"access":[],"due":[{"time":"","countbyday":false}]}},
            //  {"id":2,"schedule":{"access":[],"due":[{"time":"","countbyday":true}]}}
            //  {"id":3,"schedule":{"access":[],"due":[{"time":"","countbyday":false}]}}
            // ]
        const minsCard = deckJSON.filter(x => {
            z = x.schedule.due.filter(y => !y.countbyday)
            if (z.length > 0) // array not empty
                return z
        })
        const readyMinsCards = minsCard.filter(x => {
            let dueDate = new Date(x.schedule.due[x.schedule.due.length-1].time) // 10:57
            let now = new Date() // 11:00 right // 9:00 wrong, not ready
            let next_card_min_dif = Math.round(((dueDate - now) / 1000) / 60);
            if (next_card_min_dif <= 0) {
                return true
            }
        })
        const daysCard = deckJSON.filter(x => {
            z = x.schedule.due.filter(y =>  y.countbyday)
            if (z.length > 0) // array not empty
                return z
        })
        const readyDayCards = daysCard.filter(x => {
            let dueDate = new Date(x.schedule.due[x.schedule.due.length-1].time) // 10.57
            let now = new Date() // 11.00 right // 9.00 wrong, not ready
            if (dueDate.toDateString() === now.toDateString()) // same date
                return true
        })

        const readyCards = readyMinsCards.length >0 ? readyMinsCards : readyDayCards

        const firstNewCard = deckJSON.find(x => x.class.history.length === 0)
        if (readyCards.length > 0) {
            console.log("visiting due card")
            let firstDueCard = readyCards[0]
            let id = firstDueCard.id
            const cardMemory = new LoadCard()
            // load fileData to Memory
            await cardMemory.load(id)
            cardMemory.status = deckJSON.find(x => x.id === id).class.status
            cardMemory.steps_index = deckJSON.find(x => x.id === id).class.steps_index
            cardMemory.ease_factor = deckJSON.find(x => x.id === id).class.ease_factor
            cardMemory.interval = deckJSON.find(x => x.id === id).class.interval
            cardMemory.history = deckJSON.find(x => x.id === id).class.history

            const prompt = cardMemory.prompt()
            Object.keys(prompt).forEach(x => prompt[x] === undefined && delete prompt[x]) // remove undefined
            return app.render(req, res, '/anki_index', {"card": cardMemory.json, prompt})
        } else if (firstNewCard) {
            console.log("visiting new card")
            let prompt = new Card().prompt()
            Object.keys(prompt).forEach(x => prompt[x] === undefined && delete prompt[x])
            // render pages/anki_index.js
            return app.render(req, res, '/anki_index', {"card": firstNewCard, prompt})
        } else {
            // show overview
            // show all due cards
            // [
            //  {"id":1,"schedule":{"access":[],"due":[{"time":"","countbyday":false}]}},
            //  {"id":2,"schedule":{"access":[],"due":[{"time":"","countbyday":true}]}}
            //  {"id":3,"schedule":{"access":[],"due":[{"time":"","countbyday":false}]}}
            // ]
            const dueCard = deckJSON.map(x => {
                let dueDate = new Date(x.schedule.due[x.schedule.due.length-1].time)
                let now = new Date()
                let next_card_min_dif = Math.round(((dueDate - now) / 1000) / 60)
                // return {id: x.id, due: next_card_min_dif + "mins" }
                if (next_card_min_dif >= 1440)
                    return {id: x.id, due: (next_card_min_dif/60/24).toFixed(2) + "days"}
                else if ( 60 < next_card_min_dif && next_card_min_dif < 1440 )
                    return {id: x.id, due: (next_card_min_dif/60).toFixed(2)+ "hours"}
                else
                    return {id: x.id, due: next_card_min_dif + "mins" }
            })

            // TODO sorted in react?
            res.send(`
                <div><a href="/">HOME</a></div>
                <div>ALL FINISHED??? No new card or No review for the moment</div>
                <div>${JSON.stringify(dueCard)}</div>
            `)
        }
    })


    server.get('/crud', (req, res) => {
        return app.render(req, res, '/crud', req.query)
    })


    server.all('*', (req, res) => {
        // console.log("visiting server.all(*)")
        return handle(req, res)
    })

    server.listen(port, (err) => {
        if (err) throw err
        console.log(`> Ready on http://localhost:${port}`)
    })
})
