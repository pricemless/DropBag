const config = require('./config')
const app = require('./app')

app.listen(config.port, () => {
  console.log(`DropBag running on http://localhost:${config.port}`)
})
