import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import AppError from '../utils/AppError.js'
import { hashPassword, comparePassword } from '../utils/password.util.js'
import notificationService from '../services/notification.service.js'

const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000))

const buildTokenResponse = (user) => ({
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
})

// 1. POST /api/user/register
export const registerUser = async (req, res, next) => {
    try {
        const { email, password } = req.body

        const exist = await User.findOne({ email })
        if (exist && exist.status === 'verified') {
            return next(AppError.conflict('Email already exists'))
        }

        const hashedPassword = await hashPassword(password)
        const verificationCode = generateVerificationCode()

        const user = await User.create({
            email,
            password: hashedPassword,
            verificationCode,
            verificationAttempts: 3
        })

        const tokens = buildTokenResponse(user)

        // save refreshToken
        user.refreshToken = tokens.refreshToken
        await user.save()

        notificationService.emit('user:registered', user)

        res.status(201).json({
            error: false,
            data: {
                user: { email: user.email, status: user.status, role: user.role },
                tokens: tokens
            }
        })
    } catch (error) {
        next(error)
    }
}

// 2. PUT /api/user/validation
export const verifyEmail = async (req, res, next) => {
    try {
        const { code } = req.body
        const user = await User.findById(req.user._id)

        if (user.status === 'verified') {
            return next(AppError.badRequest('Email already verified'))
        }

        if (user.verificationAttempts <= 0) {
            return next(AppError.tooManyRequests('No attempts remaining'))
        }

        if (user.verificationCode !== code) {
            user.verificationAttempts -= 1
            await user.save()

            return next(AppError.badRequest(
                `Incorrect code. ${user.verificationAttempts} attempt(s) remaining`
            ))
        }

        user.status = 'verified'
        user.verificationCode = undefined
        await user.save()

        notificationService.emit('user:verified', user)

        res.json({
            error: false,
            message: 'Email verified successfully'
        })
    } catch (error) {
        next(error)
    }
}

// 3. POST /api/user/login
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body

        // Select hidden fields
        const user = await User.findOne({ email, deleted: false }).select('+password +refreshToken')

        if (!user) {
            return next(AppError.unauthorized('Invalid user'))
        }

        const validPassword = await compare(password, user.password)
        if (!validPassword) {
            return next(AppError.unauthorized('Invalid credentials'))
        }

        const tokens = buildTokenResponse(user)
        user.refreshToken = tokens.refreshToken
        await user.save()

        const userObj = user.toObject()
        delete userObj.password
        delete userObj.refreshToken

        res.json({
            error: false,
            data: { user: userObj, ...tokens }
        })
    } catch (error) {
        next(error)
    }
}

// 4.1. PUT /api/user/register
export const updateUserData = async (req, res, next) => {
    try {
        const { name, lastName, nif } = req.body

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, lastName, nif },
            { new: true, runValidators: true }
        )

        res.json({
            error: false,
            data: { user }
        })
    } catch (error) {
        next(error)
    }
}

// 4.2. PATCH /api/user/company
export const upsertCompany = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)

        let companyData
        let role = 'admin'

        //User is self-employed -> companyData = userData
        if (req.body.isFreelance) {
            companyData = {
                owner: user._id,
                name: `${user.name} ${user.lastName}`,
                cif: user.nif,
                address: user.address,
                isFreelance: true
            }
        } else {
            const { name, cif, address } = req.body
            const existingCompany = await Company.findOne({ cif, deleted: false })

            // Company exists -> user joins as 'guest'
            if (existingCompany) {
                await User.findByIdAndUpdate(
                    user._id,
                    { company: existingCompany._id, role: 'guest' }
                )
                return res.json({
                    error: false,
                    message: 'Joined existing company',
                    data: { company: existingCompany }
                })
            }

            companyData = {
                owner: user._id,
                name,
                cif,
                address,
                isFreelance: false
            }
        }

        const company = await Company.create(companyData)

        await User.findByIdAndUpdate(currentUser._id, { company: company._id, role })

        res.status(201).json({
            error: false,
            data: { company }
        })
    } catch (error) {
        next(error)
    }
}

// 5. PATCH /api/user/logo
export const uploadLogo = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(AppError.badRequest('No file uploaded'))
        }

        const user = await User.findById(req.user._id)
        if (!user.company) {
            return next(AppError.badRequest('User has no company'))
        }

        const logoUrl = `/uploads/${req.file.fileName}`
        await Company.findByIdAndUpdate(user.company, { logo: logoUrl })

        res.json({
            error: false,
            data: { logo: logoUrl }
        })
    } catch (error) {
        next(error)
    }
}

// 6. GET /api/user
export const getUser = async (req, res, next) => {
    try {
        // Populate: add associated company data
        const user = await User.findById(req.user._id)
            .populate('company')

        res.json({
            error: false,
            data: { user }
        })
    } catch (error) {
        next(error)
    }
}

// 7.1. POST /api/user/refresh
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body

        let decoded
        try {
            decoded = verifyRefreshToken(token)
        } catch {
            return next(AppError.unauthorized('Invalid or expired refresh token'))
        }

        const user = User.findById(decoded._id).select('+refreshToken')

        if (!user || user.deleted || user.refreshToken !== token) {
            return next(AppError.unauthorized('Refresh token not recognized'))
        }

        const tokens = buildTokenResponse(user)
        user.refreshToken = tokens.refreshToken
        await user.save()

        res.json({
            error: true,
            data: tokens
        }
        )
    } catch (error) {
        next(error)
    }
}

// 7.2. POST /api/user/logout
export const logoutUser = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { refreshToken: null })
        res.json({ error: false, message: 'Logged out successfully' })
    } catch (error) {
        next(error)
    }
}

// 8. DELETE /api/user
export const deleteUser = async (req, res, next) => {
    try {
        const soft = req.query.soft === 'true'

        if (soft) {
            await User.findByIdAndUpdate(req.user._id, { deleted: true })
        } else {
            await User.findByIdAndDelete(req.user._id)
        }

        res.json({
            error: false,
            message: soft ? 'User soft-deleted' : 'User permanently deleted'
        })
    } catch (error) {
        next(error)
    }
}
