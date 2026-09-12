require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { default: mongoose } = require('mongoose')
const errorMiddleware = require('./middlewares/error.middleware')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: process.env.SOCKET_DOMAIN || 'http://localhost:5000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
})

const users = []

const addOnlineUser = (user, socketId) => {
    const checkUser = users.find(u => u.user._id === user._id)
    if (!checkUser) {
        users.push({ user, socketId })
    } else {
        checkUser.socketId = socketId
    }
}

const removeUser = (socketId) => {
    const index = users.findIndex(u => u.socketId === socketId)
    if (index !== -1) users.splice(index, 1)
}

const getSocketId = (userId) => {
    const user = users.find(u => u.user._id === userId)
    return user ? user.socketId : null
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)

    socket.on('addOnlineUser', (user) => {
        addOnlineUser(user, socket.id)
        io.emit('getOnlineUsers', users)
    })

    socket.on('createContact', ({ currentUser, receiver }) => {
        const receiverSocketId = getSocketId(receiver?._id)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('getCreatedUser', currentUser)
        }
    })

    socket.on('sendMessage', ({ newMessage, receiver, sender }) => {
        const receiverSocketId = getSocketId(receiver?._id)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('getNewMessage', { newMessage, sender, receiver })
        }
    })

    socket.on('readMessages', ({ messages, receiver }) => {
        const receiverSocketId = getSocketId(receiver?._id)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('getReadMessages', messages)
        }
    })

    socket.on('updateMessage', ({ updatedMessage, receiver, sender }) => {
        const receiverSocketId = getSocketId(receiver?._id)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('getUpdatedMessage', { updatedMessage, sender })
        }
    })

    socket.on('deleteMessage', ({ deletedMessage, sender, receiver, filteredMessages }) => {
        const receiverSocketId = getSocketId(receiver?._id)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('getDeletedMessage', { deletedMessage, sender, filteredMessages })
        }
    })

    socket.on('typing', ({ receiver, sender, message }) => {
        const receiverSocketId = getSocketId(receiver?._id)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('getTyping', { message, sender })
        }
    })

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`)
        removeUser(socket.id)
        io.emit('getOnlineUsers', users)
    })
})
// --------------------------

// Middleware
app.use(express.json())
app.use(cors({ 
    origin: process.env.ALLOW_DOMAINS || ['http://localhost:3000'], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'] 
}))
app.use(cookieParser())

app.use('/api', require('./routes/index'))

app.use(errorMiddleware)

const bootstrap = async () => {
    try {
        if (process.env.MONGO_URI && mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI)
            console.log('MongoDB connected')
        }
        
        if (process.env.NODE_ENV !== 'production') {
            const PORT = process.env.PORT || 4000
            server.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
        }
    } catch (error) {
        console.error(error)
    }
}

bootstrap()

module.exports = app