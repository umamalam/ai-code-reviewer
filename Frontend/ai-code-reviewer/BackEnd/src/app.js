const express = require('express');
const aiRoutes = require('./routes/ai.routes')
const metricsRoutes = require('./routes/metrics.routes')
const githubRoutes = require('./routes/github.routes')
const cors = require('cors')

const app = express()

app.use(cors())

// Mounted BEFORE express.json(): the GitHub webhook route needs the raw
// request body (as bytes) to verify GitHub's HMAC signature. If express.json()
// ran first it would consume/parse the body and the signature check would fail.
app.use('/webhook', githubRoutes)

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.use('/ai', aiRoutes)
app.use('/metrics', metricsRoutes)

module.exports = app