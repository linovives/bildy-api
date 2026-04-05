import { EventEmitter } from 'node:events';

const eventEmitter = new EventEmitter();

eventEmitter.on('user:invited', (newUser) => {
  console.log(`Invitación enviada a: ${newUser.email}`);
});

export default eventEmitter;