import Link from 'next/link'

export default function Home() {
  return (
    <ul>
        <li>
            <Link href="/anki">
                <a>anki</a>
            </Link>
        </li>
        <li>
            <Link href="/crud">
                <a>CRUD</a>
            </Link>
        </li>
    </ul>
  )
}
