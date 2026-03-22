import mongoose from 'mongoose'
import addressSchema from './address.schema.js'


const companySchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    cif: {
        type: String,
        required: [true, 'CIF is required'],
        trim: true,
        uppercase: true
    },
    address: addressSchema,
    logo: {
        type: String,
        default: null
    },
    isFreelance: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
})

const Company = mongoose.model('Company', companySchema)
export default Company
