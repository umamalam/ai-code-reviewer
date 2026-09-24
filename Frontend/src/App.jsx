import { useState } from 'react'
import 'prismjs/themes/prism-tomorrow.css'
import 'highlight.js/styles/github-dark.css'
import ReviewForm from './components/ReviewForm'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [tab, setTab] = useState('review')

  return (
    <div className="app-shell">
      <nav className="tabs">
        <button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>
          Review
        </button>
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
          Dashboard
        </button>
      </nav>

      {tab === 'review' ? <ReviewForm /> : <Dashboard />}
    </div>
  )
}

export default App
