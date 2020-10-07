const fs = require('fs')
const Card = require('../utils/alg')
const axios = require('axios')
const axios_instance = axios.create({baseURL: 'http://localhost:3000'})



class LoadCard extends Card {
    constructor() {
        super();
        this.json = {}
        this.load = this.load.bind(this);
    }
    async load(id) {
        // let rawdata = fs.readFileSync('./data/deck.json')
        // let deckJSON = JSON.parse(rawdata)
        // this.json = deckJSON.find(x => x.id === Number(id))
        let deckALL = await axios_instance.get(`/json-api/cards?id=${id}`)
        this.json = await deckALL.data[0]
    }
}

module.exports = LoadCard