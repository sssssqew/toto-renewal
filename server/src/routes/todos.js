const express = require('express')
const Todo = require('../models/Todo') 
const expressAsyncHandler = require('express-async-handler') 
const { limitUsage } = require('../../limiter')
const { isAuth, isAdmin } = require('../../auth')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose
const { validationResult } = require('express-validator')
const {
  validateTodoTitle,
  validateTodoDescription,
  validateTodoCategory,
  validateTodoImgUrl
} = require('../../validator')

const router = express.Router()

// isAuth : 전체 할일목록을 조회할 권한이 있는지 검사하는 미들웨어 
router.get('/', limitUsage, isAuth, expressAsyncHandler(async (req, res, next) => {
  const todos = await Todo.find({ author: req.user._id }).populate('author') // req.user 는 isAuth 에서 전달된 값
  if(todos.length === 0){
    res.status(404).json({ code: 404, message: 'Fail to find todos !'})
  }else{
    res.json({ code: 200, todos })
  }
}))

// isAuth : 특정 할일을 조회할 권한이 있는지 검사하는 미들웨어 
router.get('/:id', limitUsage, isAuth, expressAsyncHandler(async (req, res, next) => {
  const todo = await Todo.findOne({ 
    author: req.user._id,  // req.user 는 isAuth 에서 전달된 값
    _id: req.params.id // TODO id 
  })
  if(!todo){
    res.status(404).json({ code: 404, message: 'Todo Not Found '})
  }else{
    res.json({ code: 200, todo })
  }
}))

// isAuth : 새로운 할일을 생성할 권한이 있는지 검사하는 미들웨어 
router.post('/', limitUsage, [
  validateTodoTitle(),
  validateTodoDescription(),
  validateTodoCategory(),
  validateTodoImgUrl()
], isAuth, expressAsyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    console.log(errors.array())
    res.status(400).json({ 
        code: 400, 
        message: 'Invalid Form data for todo',
        error: errors.array()
    })
  }else{
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
        category: req.body.category,
        imgUrl: req.body.imgUrl
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
  }
}))

// isAuth : 특정 할일을 변경할 권한이 있는지 검사하는 미들웨어 
router.put('/:id', limitUsage, [
  validateTodoTitle(),
  validateTodoDescription(),
  validateTodoCategory()
], isAuth, expressAsyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    console.log(errors.array())
    res.status(400).json({ 
        code: 400, 
        message: 'Invalid Form data for todo',
        error: errors.array()
    })
  }else{
    const todo = await Todo.findOne({ 
      author: req.user._id,  // req.user 는 isAuth 에서 전달된 값
      _id: req.params.id // TODO id 
    })
    if(!todo){
      res.status(404).json({ code: 404, message: 'Todo Not Found '})
    }else{
      todo.title = req.body.title || todo.title
      todo.description = req.body.description || todo.description
      todo.isDone = req.body.isDone ?? todo.isDone // req.body.isDone 이 null 또는 undefined 인 경우 기존값 사용
      todo.category = req.body.category || todo.category
      todo.imgUrl = req.body.imgUrl || todo.imgUrl
      todo.lastModifiedAt = new Date() // 수정시각 업데이트
      todo.finishedAt = req.body.isDone ? todo.lastModifiedAt : todo.finishedAt // 사용자가 종료버튼을 클릭하면 현재시각으로 종료시각 업데이트
      
      const updatedTodo = await todo.save()
      res.json({
        code: 200,
        message: 'TODO Updated',
        updatedTodo
      })
    } 
  }
}))

// isAuth : 특정 할일을 삭제할 권한이 있는지 검사하는 미들웨어 
router.delete('/:id', limitUsage, isAuth, expressAsyncHandler(async (req, res, next) => {
  const todo = await Todo.findOne({ 
    author: req.user._id,  // req.user 는 isAuth 에서 전달된 값
    _id: req.params.id // TODO id 
  })
  if(!todo){
    res.status(404).json({ code: 404, message: 'Todo Not Found '})
  }else{
    await Todo.deleteOne({ 
      author: req.user._id,  // req.user 는 isAuth 에서 전달된 값
      _id: req.params.id // TODO id 
    })
    res.status(204).json({ code: 204, message: 'TODO deleted successfully !' })
  }
}))

router.get('/group/:field', limitUsage, isAuth, isAdmin, expressAsyncHandler(async (req, res, next) => { // 어드민 페이지
  const docs = await Todo.aggregate([
    {
      $group: {
        _id: `$${req.params.field}`,
        count: { $sum: 1 }
      }
    }
  ])
  
  console.log(`Number Of Group: ${docs.length}`) // 그룹 갯수
  docs.sort((d1, d2) => d1._id - d2._id)
  res.json({ code: 200, docs})
}))

router.get('/group/date/:field', limitUsage, isAuth, isAdmin, expressAsyncHandler(async (req, res, next) => { // 어드민 페이지
  if(req.params.field === 'createdAt' || req.params.field === 'lastModifiedAt' || req.params.field === 'finishedAt'){
    const docs = await Todo.aggregate([
      {
        $group: {
          _id: { year: { $year: `$${req.params.field}` }, month: { $month: `$${req.params.field}` } },
          count: { $sum: 1 }
        }
      },
      { $sort : { _id : 1 } } // 날짜 오름차순 정렬
    ])
    
    console.log(`Number Of Group: ${docs.length}`) // 그룹 갯수
    docs.sort((d1, d2) => d1._id - d2._id)
    res.json({ code: 200, docs})
  }else{
    res.status(204).json({ code: 204, message: 'No Content'})
  }
}))

router.get('/group/mine/:field', limitUsage, isAuth, expressAsyncHandler(async (req, res, next) => { // 대쉬보드
  const docs = await Todo.aggregate([
    {
      $match: { author: new ObjectId(req.user._id) }
    },
    {
      $group: {
        _id: `$${req.params.field}`,
        count: { $sum: 1 }
      }
    }
  ])
  
  console.log(`Number Of Group: ${docs.length}`) // 그룹 갯수
  docs.sort((d1, d2) => d1._id - d2._id)
  res.json({ code: 200, docs})
}))

router.get('/group/mine/date/:field', limitUsage, isAuth, expressAsyncHandler(async (req, res, next) => { // 어드민 페이지
  if(req.params.field === 'createdAt' || req.params.field === 'lastModifiedAt' || req.params.field === 'finishedAt'){
    const docs = await Todo.aggregate([
      {
        $match: { author: new ObjectId(req.user._id) }
      },
      {
        $group: {
          _id: { year: { $year: `$${req.params.field}` }, month: { $month: `$${req.params.field}` } },
          count: { $sum: 1 }
        }
      },
      { $sort : { _id : 1 } } // 날짜 오름차순 정렬
    ])
    
    console.log(`Number Of Group: ${docs.length}`) // 그룹 갯수
    docs.sort((d1, d2) => d1._id - d2._id)
    res.json({ code: 200, docs})
  }else{
    res.status(204).json({ code: 204, message: 'No Content'})
  }
}))


module.exports = router 