// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <>
      <p>Home (unprotected)</p>
      <Link href="/dashboard">Dashboard</Link>
    </>
  )
}