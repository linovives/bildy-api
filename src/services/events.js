import { EventEmitter } from 'node:events';

const eventEmitter = new EventEmitter();

eventEmitter.on('user:registered', (user) => {
  console.log(`Usuario registrado: ${user.email}`);
});

eventEmitter.on('user:verified', (user) => {
  console.log(`Usuario verificado con éxito: ${user.email}`);
});

eventEmitter.on('user:invited', (user) => {
  console.log(`Invitación enviada a compañero: ${user.email}`);
});

eventEmitter.on('user:deleted', (userEmail) => {
  console.log(`Usuario eliminado del sistema: ${userEmail}`);
});

export default eventEmitter;