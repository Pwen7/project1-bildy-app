import mongoose from 'mongoose'

const companySchema = new mongoose.Schema({
    email: {

    }
})

const Company = mongoose.model('User', companySchema)
export default Company
