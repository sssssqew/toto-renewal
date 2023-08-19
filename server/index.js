const express = require('express') // node_modules 내 express 관련 코드를 가져온다
const app = express()
const cors = require('cors') 
const logger = require('morgan')
const mongoose = require('mongoose')
const axios = require('axios')
const cookieParser = require('cookie-parser')

const usersRouter = require('./src/routes/users')
const todosRouter = require('./src/routes/todos')
const config = require('./config')

const corsOptions = { // CORS 옵션
    origin: 'http://127.0.0.1:5500',
    credentials: true
}

mongoose.connect(config.MONGODB_URL)
.then(() => console.log("mongodb connected ..."))
.catch(e => console.log(`failed to connect mongodb: ${e}`))

app.use(cors(corsOptions)) // CORS 설정
app.use(express.json()) // request body 파싱
app.use(express.urlencoded({ extended: false }))
app.use(logger('tiny')) // Logger 설정 
app.use(cookieParser()) // 쿠키 설정

app.use('/api/users', usersRouter) // User 라우터
app.use('/api/todos', todosRouter) // Todo 라우터

app.get('/hello', (req, res) => { // URL 응답 테스트
  res.json('hello world !')
})
app.post('/hello', (req, res) => { // POST 요청 테스트 
  console.log(req.body)
  res.json({ userId: req.body.userId, email: req.body.email })
})
app.get('/error', (req, res) => { // 오류 테스트 
  throw new Error('서버에 치명적인 에러가 발생했습니다.')
})
app.get('/fetch', async (req, res) => {
  const response = await axios.get('https://jsonplaceholder.typicode.com/todos')
  res.send(response.data)
})

// 폴백 핸들러 (fallback handler)
app.use( (req, res, next) => {  // 사용자가 요청한 페이지가 없는 경우 에러처리
    res.status(404).send("Sorry can't find page")
})
app.use( (err, req, res, next) => { // 서버 내부 오류 처리
    console.error(err.stack)
    res.status(500).send("something is broken on server !")
})
app.listen(5000, () => { // 5000 포트로 서버 오픈
    console.log('server is running on port 5000 ...')
})