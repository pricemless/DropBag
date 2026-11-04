const path = require('path')
const fs = require('fs')
const express = require('express')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const { loadUser } = require('./middleware/auth')
const { errorHandler } = require('./middleware/validate')

const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(loadUser)

const api = express.Router()
api.get('/health', (req, res) => res.json({ ok: true }))
api.use('/auth', require('./routes/auth'))
api.use('/races', require('./routes/races').router)
api.use('/crew', require('./routes/crew'))
api.use('/pacers', require('./routes/pacers'))
api.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use('/api', api)

// Serve the built React app (npm run build) and let it handle client routes.
const dist = path.join(__dirname, 'client', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }))
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(dist, 'index.html')))
} else {
  app.get('/', (req, res) => res.send('DropBag API is running. Run `npm run build` to serve the web app here.'))
}

app.use(errorHandler)

module.exports = app
