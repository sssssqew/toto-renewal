const { body } = require("express-validator")

const isFieldEmpty = (field) => { // Form 필드가 비어있는지 검사
    return body(field)
    .not()
    .isEmpty()
    .withMessage(`user ${field} is required`)
    .bail() // if email is empty, the following will not be run
    .trim() // 공백제거
}
const validateUserName = () => {
    return isFieldEmpty("name")
    .isLength({ min: 2, max: 20 }) // 2~20자
    .withMessage("user name length must be between 2 ~ 20 characters")
}
const validateUserEmail = () => {
    return isFieldEmpty("email")
    .isEmail() // 이메일 형식에 맞는지 검사
    .withMessage("user email is not valid")
} 

const validateUserPassword = () => {
  return isFieldEmpty("password")
  .isLength({ min: 7 })
  .withMessage("password must be more than 7 characters")
  .bail()
  .isLength({ max: 15 })
  .withMessage("password must be lesser than 15 characters")
  .bail()
  .matches(/[A-Za-z]/)
  .withMessage("password must be at least 1 alphabet")
  .matches(/[0-9]/)
  .withMessage("password must be at least 1 number")
  .matches(/[!@#$%^&*]/)
  .withMessage("password must be at least 1 special charactor")
  .bail()
  // Form 에서 전달된 password 정보가 일치하는지 검사
  // value : password
  .custom((value, { req }) => req.body.confirmPassword === value)
  .withMessage("Passwords don't match.")
}

module.exports = {
    validateUserName,
    validateUserEmail,
    validateUserPassword
}