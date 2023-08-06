const express = require('express')
const User = require('../models/User') 
const expressAsyncHandler = require('express-async-handler') 
const { generateToken, isAuth } = require('../../auth')

const router = express.Router()

router.post('/register', expressAsyncHandler(async (req, res, next) => {
  console.log(req.body)
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    userId: req.body.userId,
    password: req.body.password,
  })
  const newUser = await user.save() // 사용자정보 DB 저장
  if(!newUser){
    res.status(401).json({ code: 401, message: 'Invalid User Data'})
  }else{
    const { name, email, userId, isAdmin, createdAt } = newUser 
    res.json({ 
      code: 200, 
      token: generateToken(newUser), 
      name, email, userId, isAdmin, createdAt
    })
  }
}))

router.post('/login', expressAsyncHandler(async (req, res, next) => {
  console.log(req.body)
  const loginUser = await User.findOne({
    email: req.body.email, 
    password: req.body.password,
  })
  if(!loginUser){
    res.status(401).json({ code: 401, message: 'Invalid Email or Password' })
  }else{
    const { name, email, userId, isAdmin, createdAt } = loginUser 
    res.json({ 
      code: 200, 
      token: generateToken(loginUser), 
      name, email, userId, isAdmin, createdAt
    })
  }
}))

router.post('/logout', (req, res, next) => {
  res.json("로그아웃")
})

router.put('/:id', (req, res, next) => {
  res.json("사용자정보 변경")
})

router.delete('/:id', (req, res, next) => {
  res.json("사용자정보 삭제")
})

module.exports = router 