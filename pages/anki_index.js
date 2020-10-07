import { useRouter } from 'next/router'
import {useState} from 'react'

export async function getServerSideProps(data){
    return {
        props: data.query
    }
}

function A(dataProps) {
    const router = useRouter()
    const [showing, setShow] = useState(false)
    return <div>
        <div> <a href="/">HOME</a> </div>
        anki page
        <div>
            {showing
                ? <div>all: {JSON.stringify(dataProps)}</div>
                : <div>front: {JSON.stringify(dataProps.card.front)}</div>
            }
        </div>
        <button onClick={()=> { setShow(true) }}>show</button>
        <div>
            {
                Object.keys(dataProps.prompt).map((x, index) =>
                    <div key={index}>
                        <form onSubmit={(e)=>{
                            e.preventDefault()
                            console.log("fetching")
                            fetch(`/anki?button=${x.slice(0,-4)}&id=${dataProps.card.id}`, {
                                method: 'POST',
                            }).then(res => {
                                router.push('/anki') // visiting /anki
                            })
                        }}>
                            <input type="submit" value={
                                dataProps.prompt[x] < 1
                                    ? x.slice(0, -4) + " " + dataProps.prompt[x] * 1440 + "m"
                                    : x.slice(0, -4) + " " +  dataProps.prompt[x] + "d"
                            }
                            />
                        </form>
                    </div>
                )
            }
        </div>
    </div>
}

export default A

