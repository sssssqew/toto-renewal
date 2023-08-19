const express = require('express')
const User = require('../models/User') 
const expressAsyncHandler = require('express-async-handler') 
const { generateToken, isAuth, isAdmin } = require('../../auth')
const { limitUsage } = require('../../limiter')
const { validationResult } = require('express-validator')
const {
    validateUserName,
    validateUserEmail,
    validateUserId,
    validateUserPassword
} = require('../../validator')

const router = express.Router()

router.get('/', limitUsage, isAuth, isAdmin, expressAsyncHandler(async (req, res, next) => { // 관리자만 전체 사용자목록 보기
  const users = await User.find({}, { _id:0, password:0, lastModifiedAt:0 }) // 전체 사용자목록 조회시 고유 ID, 비밀번호, 업데이트날짜 제외
  if(users.length === 0){
    res.status(404).json({ code: 404, message: 'Fail to find users !'})
  }else{
    res.json({ code: 200, users })
  }
}))

router.post('/register', limitUsage, [
  validateUserName(),
  validateUserEmail(),
  validateUserId(),
  validateUserPassword()
], expressAsyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  console.log(req.body)
  if(!errors.isEmpty()){
      console.log(errors.array())
      res.status(400).json({ 
          code: 400, 
          message: 'Invalid Form data for user',
          error: errors.array()
      })
  }else{
    const UserToRegister = await User.findOne({
      email: req.body.email 
    })
    if(UserToRegister){
      res.status(401).json({ code: 401, message: 'You are already registered before ! Please log in.'})
    }else{
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        userId: req.body.userId,
        password: req.body.password
      })
      const newUser = await user.save() // DB에 User 생성
      if(!newUser){
          res.status(401).json({ code: 401, message: 'Invalid User Data'})
      }else{
          const { name, email, userId, isAdmin, createdAt } = newUser 
          const token = generateToken(newUser)

          res.cookie('token', JSON.stringify(token), {
            httpOnly: true, // 배포시 true
            secure: true, // 배포시 true
            expires: new Date(Date.now() + 24 * 3600000) // cookie will be removed after 24 hours
          })
          res.json({
              code: 200,
              token, name, email, userId, isAdmin, createdAt,
              message: "You are registered successfully !"
          })
      }
    }
  }
}))

router.post('/login', limitUsage, [
  validateUserEmail(),
  validateUserPassword()
] , expressAsyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  console.log(req.body)
  if(!errors.isEmpty()){
    console.log(errors.array())
    res.status(400).json({ 
        code: 400, 
        message: 'Invalid Form data for user',
        error: errors.array()
    })
  }else{
    const loginUser = await User.findOne({
      email: req.body.email, 
      password: req.body.password,
    })
    if(!loginUser){
      res.status(401).json({ code: 401, message: 'Invalid Email or Password' })
    }else{
      const { name, email, userId, isAdmin, createdAt } = loginUser 
      const token = generateToken(loginUser)

      res.cookie('token', JSON.stringify(token), {
        httpOnly: true, // 배포시 true
        secure: true, // 배포시 true
        expires: new Date(Date.now() + 24 * 3600000) // cookie will be removed after 24 hours
      })
      res.json({ 
        code: 200, 
        token, name, email, userId, isAdmin, createdAt,
        message: "You are Logged in successfully !"
      })
    }
  }
}))

router.post('/logout', limitUsage, isAuth, expressAsyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
  if (!user) {
    res.status(404).json({ code: 404, message: 'User Not Founded'})
  }else{
    res.clearCookie('token', {
      httpOnly: true, // 배포시 true
      secure: true, // 배포시 true
    })
    res.status(200).json({ code: 200, message: 'User Logged out successfully !' })
  } 
}))


// isAuth : 사용자를 수정할 권한이 있는지 검사하는 미들웨어 
router.put('/', limitUsage, [
  validateUserName(),
  validateUserEmail(),
  validateUserId(),
  validateUserPassword()
], isAuth, expressAsyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    console.log(errors.array())
    res.status(400).json({ 
        code: 400, 
        message: 'Invalid Form data for user',
        error: errors.array()
    })
  }else{
    const user = await User.findById(req.user._id)
    if(!user){
      res.status(404).json({ code: 404, message: 'User Not Founded'})
    }else{
      user.name = req.body.name || user.name 
      user.email = req.body.email || user.email
      user.userId = req.body.userId || user.userId // 사용자 아이디 수정가능
      user.password = req.body.password || user.password
      user.isAdmin = req.body.isAdmin ?? user.isAdmin // req.body.isAdmin 이 null 또는 undefined 인 경우 기존값 사용
      user.lastModifiedAt = new Date() // 수정시각 업데이트
      
      const updatedUser = await user.save()
      const { name, email, userId, isAdmin, createdAt } = updatedUser
      const token = generateToken(updatedUser)

      res.cookie('token', JSON.stringify(token), {
        httpOnly: true, // 배포시 true
        secure: true, // 배포시 true
        expires: new Date(Date.now() + 24 * 3600000) // cookie will be removed after 24 hours
      })
      res.json({
        code: 200,
        token, name, email, userId, isAdmin, createdAt,
        message: "Your User Info. are updated successfully !"
      })
    }
  }
}))
// isAuth : 사용자를 삭제할 권한이 있는지 검사하는 미들웨어 
router.delete('/', limitUsage, isAuth, expressAsyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.user._id)
  if (!user) {
    res.status(404).json({ code: 404, message: 'User Not Founded'})
  }else{
    res.clearCookie('token', {
      httpOnly: true, // 배포시 true
      secure: true, // 배포시 true
    })
    res.status(204).json({ code: 204, message: 'User deleted successfully !' })
  } 
}))

module.exports = router 