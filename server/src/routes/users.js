const express = require('express')
const User = require('../models/User') 
const expressAsyncHandler = require('express-async-handler') 
const { generateToken, isAuth } = require('../../auth')
const { limitUsage } = require('../../limiter')
const { validationResult } = require('express-validator')
const {
    validateUserName,
    validateUserEmail,
    validateUserId,
    validateUserPassword
} = require('../../validator')

const router = express.Router()

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
          res.json({
              code: 200,
              token: generateToken(newUser),
              name, email, userId, isAdmin, createdAt
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
      res.json({ 
        code: 200, 
        token: generateToken(loginUser), 
        name, email, userId, isAdmin, createdAt
      })
    }
  }
}))

router.post('/logout', (req, res, next) => {
  res.json("로그아웃")
})

// isAuth : 사용자를 수정할 권한이 있는지 검사하는 미들웨어 
router.put('/', limitUsage, [
  validateUserName(),
  validateUserEmail(),
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
      user.password = req.body.password || user.password
      user.isAdmin = req.body.isAdmin || user.isAdmin
      user.lastModifiedAt = new Date() // 수정시각 업데이트
      
      const updatedUser = await user.save()
      const { name, email, userId, isAdmin, createdAt } = updatedUser
      res.json({
        code: 200,
        token: generateToken(updatedUser),
        name, email, userId, isAdmin, createdAt
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
    res.status(204).json({ code: 204, message: 'User deleted successfully !' })
  } 
}))

module.exports = router 