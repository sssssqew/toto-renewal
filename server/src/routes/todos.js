const express = require('express')
const Todo = require('../models/Todo') 
const expressAsyncHandler = require('express-async-handler') 
const { isAuth } = require('../../auth')

const router = express.Router()


router.get('/', (req, res, next) => {
  res.json("전체 할일목록 조회")
})

router.get('/:id', (req, res, next) => {
  res.json("특정 할일 조회")
})

// isAuth : 새로운 할일을 생성할 권한이 있는지 검사하는 미들웨어 
router.post('/', isAuth, expressAsyncHandler(async (req, res, next) => {
  const searchedTodo = await Todo.findOne({
    author: req.user._id, 
    title: req.body.title,
  })
  if(searchedTodo){
    res.status(204).json({ code: 204, message: 'Todo you want to create already exists in DB !'})
  }else{
    const todo = new Todo({
      author: req.user._id, // 사용자 id
      title: req.body.title,
      description: req.body.description,
    })
    const newTodo = await todo.save()
    if(!newTodo){
      res.status(401).json({ code: 401, message: 'Failed to save todo'})
    }else{
      res.status(201).json({ 
        code: 201, 
        message: 'New Todo Created',
        newTodo // DB에 저장된 할일
      })
    }
  }
}))

router.put('/:id', (req, res, next) => {
  res.json("특정 할일 변경")
})

router.delete('/:id', (req, res, next) => {
  res.json("특정 할일 삭제")
})

module.exports = router 