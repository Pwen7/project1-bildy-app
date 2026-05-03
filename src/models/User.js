import mongoose from 'mongoose'
import addressSchema from './address.model.js'


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'An email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false
    },
    name: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    nif: {
        type: String,
        trim: true,
        uppercase: true
    },
    role: {
        type: String,
        enum: ['admin', 'guest'],
        default: 'admin',
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified'],
        default: 'pending',
        index: true
    },
    verificationCode: {
        type: String,
        select: false
    },
    verificationAttempts: {
        type: Number,
        max: [3, '3 max attempts']
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null,
        index: true
    },
    address: addressSchema,
    refreshToken: {
        type: String,
        default: null,
        select: false
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Virtual fullName
userSchema.virtual('fullName').get(function () {
    return `${this.name || ''} ${this.lastName || ''}`.trim()
})

const User = mongoose.model('User', userSchema)
export default User
