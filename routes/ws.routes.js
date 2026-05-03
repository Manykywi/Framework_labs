import eventBus from '../src/events/eventBus.js';
import studentService from '#services/student.service';

async function wsRoutes(fastify) {
  fastify.get('/ws', { websocket: true }, async (socket) => {
    const students = await studentService.getAllStudents();
    socket.send(JSON.stringify({ event: 'init', data: students }));

    const onCreated = (data) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ event: 'created', data }));
      }
    };
    const onUpdated = (data) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ event: 'updated', data }));
      }
    };
    const onDeleted = (id) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ event: 'deleted', id }));
      }
    };

    eventBus.on('student:created', onCreated);
    eventBus.on('student:updated', onUpdated);
    eventBus.on('student:deleted', onDeleted);

    socket.on('close', () => {
      eventBus.off('student:created', onCreated);
      eventBus.off('student:updated', onUpdated);
      eventBus.off('student:deleted', onDeleted);
    });
  });
}

export default wsRoutes;
