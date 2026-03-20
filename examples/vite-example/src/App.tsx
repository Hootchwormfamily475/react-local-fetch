import { useLocalFetch, localFetch } from 'react-local-fetch'
import { useQuery } from '@tanstack/react-query'
import './App.css'

function App() {
  // 1. Hook usage
  const { data, isLoading } = useLocalFetch('https://api.example.com/stations', {
    key: 'vite-demo-stations',
    ttl: 60 * 60, // 1h
  })
  const stations = data as any[]

  // 2. Advanced usage (React Query + Encryption)
  const { data: encryptedData } = useQuery({
    queryKey: ['encrypted-stations'],
    queryFn: () => localFetch<any[]>('https://api.example.com/secure', {
      key: 'vite-secure-db',
      encrypt: true,
      secret: 'vite-secret',
      version: 1
    })
  })

  return (
    <div className="demo-container">
      <h1>react-local-fetch + Vite</h1>
      
      <div className="grid">
        <section>
          <h2>Basic Hook</h2>
          {isLoading && <p>Loading...</p>}
          <ul>
            {stations?.map((s: any) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>React Query + Encryption</h2>
          <div className="secure-list">
            {encryptedData?.map((s: any) => (
              <div key={s.id} className="secure-item">
                <span>{s.name}</span>
                <span className="badge">SECURE</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
