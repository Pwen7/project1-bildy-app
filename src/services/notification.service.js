import { EventEmitter } from 'node:events'

class NotificationService extends EventEmitter { }

const notificationService = new NotificationService()

// Listeners
notificationService.on('user:registered', (user) => {
    console.log(`[EVENT] user:registered - ${user.email}`)
})

notificationService.on('user:verified', (user) => {
    console.log(`[EVENT] user:verified - ${user.email}`)
})

notificationService.on('user:invited', (user) => {
    console.log(`[EVENT] user:invited - ${user.email}`)
})

notificationService.on('user:deleted', (user) => {
    console.log(`[EVENT] user:deleted - ${user.email}`)
})

export default notificationService
