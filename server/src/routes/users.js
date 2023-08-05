const express = require('express')
const User = require('../models/User') 

const router = express.Router()

router.post('/register', (req, res, next) => {
  res.json("회원가입")
})
router.post('/login', (req, res, next) => {
  res.json("로그인")
})
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