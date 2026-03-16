import mongoose from "mongoose"

const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        trim: true
    },
    number: {
        type: String,
        trim: true
    },
    postal: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    province: {
        type: String,
        trim: true
    }
}, { _id: false })

export default addressSchema
