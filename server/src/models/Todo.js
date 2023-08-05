const mongoose = require('mongoose')

const { Schema } = mongoose
const { Types: { ObjectId } } = Schema

const todoSchema = new Schema({ // 스키마 정의
  author: {
    type: ObjectId, 
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
  },
  isDone: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now,
  },
  finishedAt: {
    type: Date,
    default: Date.now
  }
})

const Todo = mongoose.model('Todo', todoSchema)
module.exports = Todo

// todo 데이터 생성 테스트
// const todo = new Todo({
//   author: '111111111111111111111111', // 24자리
//   title: ' 주말에 공원 산책하기  ',
//   description: '주말에 집 주변에 있는 공원에 가서 1시간동안 산책하기',
// });
// todo.save().then(() => console.log('todo created !'));