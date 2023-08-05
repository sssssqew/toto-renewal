var express = require('express')
var app = express()

app.get('/hello', (req, res) => {
  res.send('hello world !')
})

app.get('/error', (req, res) => {
  throw new Error('서버에 치명적인 에러가 발생했습니다.')
})

// 폴백 핸들러 (fallback handler)
app.use( (req, res, next) => {
  res.status(404).send("Sorry can't find your page !")
})
app.use( (err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('something is broken on server !')
})

app.listen(5000, () => {
  console.log('server is running on port 5000...')
})