import bcryptjs from 'bcryptjs'

const SALT_ROUNDS = 10

// plain text -> hashed text
export const hashPassword = async (password) => {
    return bcryptjs.hash(password, SALT_ROUNDS)
}

// plain text == saved hashed text
export const comparePassword = async (password, hash) => {
    return bcryptjs.compare(password, hash)
}
