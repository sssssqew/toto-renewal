var express = require('express')
var app = express()

app.get('/hello', (req, res) => {
  res.send('hello world !')
})

app.listen(5000, () => {
  console.log('server is running on port 5000...')
})