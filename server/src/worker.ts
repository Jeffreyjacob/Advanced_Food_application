import { emailWorker } from './queue/email/worker';
import { documentValidatorWorker } from './queue/documentValidator/worker';

export const Workers = async () => {
  emailWorker.on('ready', () => {
    console.log('Email worker is ready');
  });

  emailWorker.on('error', (err) => {
    console.error('Email worker error:', err);
  });

  documentValidatorWorker.on('ready', () => {
    console.log('Document validator  worker is ready');
  });

  documentValidatorWorker.on('error', (err) => {
    console.error('Document validator worker error:', err);
  });
};
