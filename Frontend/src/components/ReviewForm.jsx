import { useState } from 'react'
import Editor from 'react-simple-code-editor'
import prism from 'prismjs'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { getReview } from '../api'

const SEVERITY_STYLE = {
  critical: { emoji: '🔴', label: 'Critical' },
  major: { emoji: '🟠', label: 'Major' },
  minor: { emoji: '🟡', label: 'Minor' },
  nit: { emoji: '⚪', label: 'Nit' }
}

let nextId = 1
function emptyFile() {
  const id = nextId++
  return { id, filename: `file-${id}.js`, content: '// paste code here' }
}

export default function ReviewForm() {
  const [files, setFiles] = useState([emptyFile()])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function updateFile(id, patch) {
    setFiles(fs => fs.map(f => (f.id === id ? { ...f, ...patch } : f)))
  }

  function addFile() {
    setFiles(fs => [...fs, emptyFile()])
  }

  function removeFile(id) {
    setFiles(fs => (fs.length > 1 ? fs.filter(f => f.id !== id) : fs))
  }

  async function runReview() {
    setLoading(true)
    setError(null)
    try {
      const payload = files.map(({ filename, content }) => ({ filename, content }))
      const data = await getReview(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Review failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <div className="left">
        <div className="files-scroll">
          {files.map(file => (
            <div key={file.id} className="file-block">
              <div className="file-header">
                <input
                  className="filename-input"
                  value={file.filename}
                  onChange={e => updateFile(file.id, { filename: e.target.value })}
                />
                {files.length > 1 && (
                  <button className="remove-file" onClick={() => removeFile(file.id)}>✕</button>
                )}
              </div>
              <div className="code">
                <Editor
                  value={file.content}
                  onValueChange={content => updateFile(file.id, { content })}
                  highlight={code => prism.highlight(code, prism.languages.javascript, 'javascript')}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 15,
                    minHeight: '160px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="review-actions">
          <button className="add-file" onClick={addFile}>+ Add file</button>
          <button className="review" onClick={runReview} disabled={loading}>
            {loading ? 'Reviewing…' : files.length > 1 ? `Review ${files.length} files` : 'Review'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="right">
        {result ? (
          <>
            <Markdown rehypePlugins={[rehypeHighlight]}>{result.summary}</Markdown>

            {result.issues && result.issues.length > 0 && (
              <table className="issues-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Category</th>
                    <th>File</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {result.issues.map((issue, i) => {
                    const sev = SEVERITY_STYLE[issue.severity] || SEVERITY_STYLE.minor
                    return (
                      <tr key={i}>
                        <td>{sev.emoji} {sev.label}</td>
                        <td>{issue.category || '-'}</td>
                        <td><code>{issue.file || '-'}</code></td>
                        <td>
                          <strong>{issue.title}</strong>
                          {issue.description && <p>{issue.description}</p>}
                          {issue.suggestion && <pre>{issue.suggestion}</pre>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <p className="placeholder">Run a review to see AI feedback here.</p>
        )}
      </div>
    </main>
  )
}
