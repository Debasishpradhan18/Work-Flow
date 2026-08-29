const Message = require('../models/Message');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join a user-specific room for real-time notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their personal socket room.`);
      }
    });

    // Join project chat room
    socket.on('join_project', (projectId) => {
      if (projectId) {
        socket.join(`project_${projectId}`);
        console.log(`Socket ${socket.id} joined project room: project_${projectId}`);
      }
    });

    // Leave project chat room
    socket.on('leave_project', (projectId) => {
      if (projectId) {
        socket.leave(`project_${projectId}`);
        console.log(`Socket ${socket.id} left project room: project_${projectId}`);
      }
    });

    // Handle project-based chat messages
    socket.on('send_message', async (data) => {
      try {
        const { senderId, projectId, message } = data;

        if (!senderId || !projectId || !message) return;

        // Save message in MongoDB
        const newMessage = await Message.create({
          project: projectId,
          sender: senderId,
          message: message.trim()
        });

        // Populate sender info
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'name email avatar role');

        // Broadcast to all sockets in the project room
        io.to(`project_${projectId}`).emit('new_message', populatedMessage);

        // Fetch project to find other members and send them a real-time notification
        const project = await Project.findById(projectId);
        if (project) {
          project.members.forEach(async (memberId) => {
            // Don't notify the sender themselves
            if (memberId.toString() !== senderId.toString()) {
              // We could write a notification to the DB here, but to avoid spam, we emit a socket event
              io.to(`user_${memberId}`).emit('chat_notification', {
                project: { _id: project._id, name: project.name },
                message: `New message in ${project.name}`
              });
            }
          });
        }
      } catch (error) {
        console.error('Socket message handler error:', error.message);
      }
    });

    // Handle real-time Kanban board movement syncing
    socket.on('task_moved', (data) => {
      const { projectId, taskId, title, fromStatus, toStatus, userName } = data;
      // Broadcast to other members of the project room
      socket.to(`project_${projectId}`).emit('task_status_updated', {
        taskId,
        title,
        fromStatus,
        toStatus,
        userName
      });
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
