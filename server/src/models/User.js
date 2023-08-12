const mongoose = require('mongoose')
const moment = require("moment")

const { Schema } = mongoose

const userSchema = new Schema({ // 스키마 정의
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // unique: 색인(primary key) email은 중복불가
  },
  userId: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
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
  }
}) 

userSchema.virtual('status').get(function () {
  return this.isAdmin ? "관리자" : "사용자"
})
userSchema.virtual('createdAgo').get(function () {
  return moment(this.createdAt).fromNow() // day ago
})
userSchema.virtual('lastModifiedAgo').get(function () {
  return moment(this.lastModifiedAt).fromNow() // day ago
})

const User = mongoose.model('User', userSchema)
module.exports = User

// user 데이터 생성 테스트
// const user = new User({
//   name: '태양',
//   email: 'sun@gmail.com',
//   userId: 'sunrise',
//   password: '1234567890',
//   isAdmin: true,
// });
// user.save().then(() => console.log('user created !'));

