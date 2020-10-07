// https://www.taniarascia.com/crud-app-in-react-with-hooks/
import React, {useEffect, useState} from 'react'
import Link from "next/link";
const axios = require('axios')
const axios_instance = axios.create({baseURL: 'http://localhost:3000'})

export async function getServerSideProps(data){
    const dall = await axios_instance.get(`/json-api/cards/`)
    let cards = await dall.data
    const cardsData = cards.map(card => {
        let {id, front, back} = card
        return {id, front, back}
    })
    return {
        props: {cards: cardsData}
    }
}

const App = (dataProps) => {
    // Data
    // const usersData = [
    //     { id: 1, front: 'Tania', back: 'floppydiskette' },
    //     { id: 2, front: 'Craig', back: 'siliconeidolon' },
    //     { id: 3, front: 'Ben', back: 'benisphere' },
    // ]
    const cardsData = dataProps.cards

    const [ cards, setCards ] = useState(cardsData)
    const [ editing, setEditing ] = useState(false)

    const initialFormState = { id: null, front: '', back: '' }
    const [ card, setCard ] = useState(initialFormState)
    const [ currentCard, setCurrentCard ] = useState(initialFormState)

    // CRUD operations
    const addCard = card => {
        let nextId = cards.slice(-1).map(x => x.id)
        // handle id NaN if data users null
        card.id = parseInt(nextId) + 1 || 1
        setCards([ ...cards, card ])

        const newCard = { ...card,
            "assets": {
                "audio": [],
                "picture": [],
                "note": []
            },
            "class": {
                "history": [],
                "status": "learning",
                "steps_index": 0,
                "ease_factor": 2.5,
                "interval": null
            },
            "schedule": {
                "access": [],
                "due": []
            }
        }

        axios_instance.post(`/json-api/cards`, newCard)
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    const deleteCard = id => {
        setEditing(false)
        setCards(cards.filter(card => card.id !== id))

        axios_instance.delete(`/json-api/cards/${id}`)
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    const updateCard = (id, updatedCard) => {
        setEditing(false)
        setCards(cards.map(card => (card.id === id ? updatedCard : card)))

        // updateUser(currentUser.id, currentUser)
        axios_instance.patch(`/json-api/cards/${id}`, updatedCard)
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    const editRow = card => {
        setEditing(true)
        setCurrentCard({ id: card.id, front: card.front, back: card.back })
    }

    return (
        <>
            <div><a href="/">HOME</a></div>
        <div>
            <h1>CRUD App with Hooks</h1>
            <div>
                    {editing
                        ?  <>
                            <h2>Edit card</h2>
                            <form onSubmit={e => {
                                e.preventDefault()
                                updateCard(currentCard.id, currentCard)
                            }}>
                                <label>Front</label>
                                <input type="text" name="front" value={currentCard.front}
                                       onChange={ e =>
                                           setCurrentCard({ ...currentCard, [e.target.name]: e.target.value })
                                       } />
                                <label>Back</label>
                                <input type="text" name="back" value={currentCard.back}
                                       onChange={ e =>
                                           setCurrentCard({ ...currentCard, [e.target.name]: e.target.value })
                                       } />
                                <button>Update card</button>
                                <button onClick={() => setEditing(false)}>
                                    Cancel
                                </button>
                            </form>

                        </>
                        :  <>
                                <h2>Add card</h2>
                                <form onSubmit={event => {
                                    event.preventDefault()
                                    if (!card.front || !card.back) return
                                    addCard(card)
                                    setCard(initialFormState)
                                }}>
                                    <label>Front</label>
                                    <input type="text" name="front" value={card.front} onChange={
                                        e => setCard({ ...card, [e.target.name]: e.target.value })
                                    } />
                                    <label>Back</label>
                                    <input type="text" name="back" value={card.back} onChange={
                                        e => setCard({ ...card, [e.target.name]: e.target.value })
                                    } />
                                    <button>Add new card</button>
                                </form>
                            </>
                    }
                <div>
                    <h2>View cards</h2>
                    <table>
                        <thead>
                        <tr>
                            <th>Front</th>
                            <th>Back</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {cards.length > 0
                            ? cards.map(card => (
                                <tr key={card.id}>
                                    <td>{card.front}</td>
                                    <td>{card.back}</td>
                                    <td>
                                        <button onClick={() => editRow(card)}>
                                            Edit
                                        </button>
                                        <button onClick={() => deleteCard(card.id)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                            : <tr>
                                <td>No cards</td>
                            </tr>
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
            </>
    )
}

export default App