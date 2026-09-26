import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar
} from 'recharts'
import { getMetricsSummary, getMetricsHistory, getRecentReviews } from '../api'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    Promise.all([getMetricsSummary(), getMetricsHistory(30), getRecentReviews(10)])
      .then(([s, h, r]) => {
        if (!mounted) return
        setSummary(s)
        setHistory(h)
        setRecent(r)
      })
      .catch(() => mounted && setError('Could not load metrics. Is the backend running?'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  if (loading) return <p className="placeholder">Loading metrics…</p>
  if (error) return <p className="placeholder error">{error}</p>

  const t = summary?.totals || {}
  const hasData = (t.total_reviews || 0) > 0

  return (
    <div className="dashboard">
      <div className="stat-cards">
        <StatCard label="Total reviews" value={t.total_reviews || 0} />
        <StatCard label="Files reviewed" value={t.total_files || 0} />
        <StatCard label="Critical issues" value={t.critical || 0} tone="critical" />
        <StatCard label="Security flags" value={t.security || 0} tone="security" />
      </div>

      {!hasData ? (
        <p className="placeholder">No reviews yet — run one from the Review tab, or open a pull request on a connected repo.</p>
      ) : (
        <>
          <div className="chart-block">
            <h3>Issues found over time</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="critical" stroke="#e53935" />
                <Line type="monotone" dataKey="major" stroke="#fb8c00" />
                <Line type="monotone" dataKey="minor" stroke="#fdd835" />
                <Line type="monotone" dataKey="nit" stroke="#9e9e9e" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-block">
            <h3>Reviews per day</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="reviews" fill="#5c6bc0" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="recent-block">
            <h3>Recent reviews</h3>
            <table>
              <thead>
                <tr>
                  <th>When</th><th>Source</th><th>Repo / PR</th><th>Files</th><th>Critical</th><th>Major</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>{r.source}</td>
                    <td>{r.repo ? `${r.repo}${r.pr_number ? ` #${r.pr_number}` : ''}` : '—'}</td>
                    <td>{r.file_count}</td>
                    <td>{r.critical_count}</td>
                    <td>{r.major_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`stat-card ${tone || ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
