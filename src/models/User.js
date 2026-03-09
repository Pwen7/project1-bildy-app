import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    email: {

    }
})

const User = mongoose.model('User', userSchema)
export default User
