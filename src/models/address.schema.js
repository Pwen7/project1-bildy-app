import mongoose from "mongoose"

const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: [true, 'Street is required'],
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
        required: [true, 'City is required'],
        trim: true
    },
    province: {
        type: String,
        required: [true, 'Province is required'],
        trim: true
    }
}, { _id: false })

export default addressSchema
