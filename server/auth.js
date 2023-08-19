const config = require('./config')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const numbers = [2, 3, 4, 5, 6, 7, 8, 9]

// 배열에서 랜덤한 값 선택
const selectRandomValue = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)]
}
// 랜덤 문자열 생성
const generateRandomString = n => {
  const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
  const str = new Array(n).fill('a')
  return str.map(s => alphabet[Math.floor(Math.random()*alphabet.length)]).join("")
}

// 두 배열의 값을 믹스하고 문자열로 만들기
const mixArraysToString = (arr1, arr2) => {
  const length = arr1.length > arr2.length ?  arr1.length: arr2.length
  let str = ''

  for(let i=0; i<length; i++){
    console.log(arr1[i], arr2[i])
    str += arr1[i] || ''
    str += '>'            // UUID 와 사용자정보를 구분하기 위한 구분문자
    str += arr2[i] || ''
    str += '>'
  }
  return str 
}

// 키로 설정한 배수의 인덱스 위치에 랜덤문자 추가하기
const insertRandomStrToMixedUserInfo = (mixedUserInfo) => {
  const pos = selectRandomValue(numbers) // 키 설정
  return mixedUserInfo.map( (s, index) => index % pos === 0 ? generateRandomString(1) + s + ',' : s + ',').join('') + pos // 키의 값번째 배수에 랜덤문자 추가함
}

// 키로 설정한 배수의 인덱스 위치에서 랜덤문자 제거하기
const removeRandomStrToEncryptedUserInfo = (encryptedUser) => {
  const pos = encryptedUser[encryptedUser.length - 1] // 키 조회
  console.log('키: ', pos)
  encryptedUser = encryptedUser.slice(0, encryptedUser.length-1) // 키 제외
  console.log(encryptedUser.split(',').map( (s, index) => index % pos === 0 ? s[1]: s).reverse().join(''))
  return encryptedUser.split(',').map( (s, index) => index % pos === 0 ? s[1]: s) // 키의 값 번째 배수에서 랜덤문자 제거함
}

// 사용자정보 암호화하기
const encrypt = (user) => {
  // UUID 발급후 하이픈(-)으로 끊어서 사용자정보 문자열과 뒤섞기
  const uuid = uuidv4().split('-')
  console.log(uuid)

  user = [
    user._id.toString(), 
    user.name, 
    user.email, 
    user.userId, 
    user.isAdmin.toString(), 
    user.createdAt.toString()
  ]
  
  // 믹스된 사용자정보 문자열을 반대로 뒤짚기
  const mixedUserInfo = mixArraysToString(user, uuid).split('').reverse()
  console.log(mixedUserInfo)

  // mixedUserInfo의 pos (2~9) 위치에 랜덤한 문자열을 추가하기
  return insertRandomStrToMixedUserInfo(mixedUserInfo)
}

// 사용자정보 복호화하기
const decrypt = (encryptedUser) => {
  let decryptedUser = removeRandomStrToEncryptedUserInfo(encryptedUser)
  .reverse().join('').split('>')
  .filter( (field, index) => index % 2 === 0)
  .filter( field => field !== '')

  const [_id, name, email, userId, isAdmin, createdAt] = decryptedUser
  
  return {
    _id: new ObjectId(_id),
    createdAt: new Date(createdAt),
    isAdmin: Boolean(isAdmin),
    name, email, userId
  }
}

const generateToken = (user) => { // 토큰 생성
  const encryptedUser = encrypt(user)
  console.log('encrypted user: ', encryptedUser)

  return jwt.sign({
    encryptedUser   // 암호화된 사용자정보로부터 jwt 토큰 생성
  },
  config.JWT_SECRET, // jwt 비밀키
  {
    expiresIn: '1d', // 만료기한 (하루)
    issuer: 'sunrise',
  })
}

const isAuth = (req, res, next) => { // 권한확인
  console.log(req.cookies.token)
  const token = JSON.parse(req.cookies.token) // 요청헤더에 저장된 토큰
  if(!token){
    res.status(401).json({message: 'Token is not supplied'}) // 헤더에 토근이 없는 경우
  }else{
    // const token = bearerToken.slice(7, bearerToken.length) // Bearer 글자는 제거하고 jwt 토큰만 추출
    jwt.verify(token, config.JWT_SECRET, (err, userInfo) => {
      if(err && err.name === 'TokenExpiredError'){ // 토큰만료
        res.status(419).json({ code: 419, message: 'token expired !'})
      }else if(err){
        res.status(401).json({ code: 401, message: 'Invalid Token !'})
      }else{
        const decryptedUser = decrypt(userInfo.encryptedUser)
        console.log("decrypted user: ", decryptedUser)
        req.user = decryptedUser
        next()
      }
    })
  }
}

const isAdmin = (req, res, next) => { // 관리자 확인
  if(req.user && req.user.isAdmin){
    next()
  }else{
    res.status(401).json({ code: 401, message: 'You are not valid admin user !'})
  }
}

module.exports = {
  generateToken,
  isAuth,
  isAdmin,
}