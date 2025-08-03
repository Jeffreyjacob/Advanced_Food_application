import { emailWorker } from './queue/email/worker';
import { documentValidatorWorker } from './queue/documentValidator/worker';
import { expiryDocumentWorker } from './queue/expiryDocument/worker';
import { reminderExpiredDocumentWorker } from './queue/reminderExpiryDocument/worker';

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

  expiryDocumentWorker.on('ready', () => {
    console.log('expiry document worker is ready');
  });

  expiryDocumentWorker.on('error', (err) => {
    console.log('expiry document worker error:', err);
  });

  reminderExpiredDocumentWorker.on('ready', () => {
    console.log('reminderExpiredDocument is ready');
  });

  reminderExpiredDocumentWorker.on('error', (err) => {
    console.log('reminderExpiredDocument error:', err);
  });
};
