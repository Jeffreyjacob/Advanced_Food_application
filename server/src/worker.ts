import { emailWorker } from './queue/email/worker';
import { documentValidatorWorker } from './queue/documentValidator/worker';
import { expiryDocumentWorker } from './queue/expiryDocument/worker';
import { reminderExpiredDocumentWorker } from './queue/reminderExpiryDocument/worker';
import { vehicleValidatorWorker } from './queue/driverValidator/worker';
import { expiredCheckoutSessionWorer } from './queue/expiredCheckoutSession/worker';
import { expiredRequestWorker } from './queue/expiredRequest/worker';
import { retryRefundPaymentWorker } from './queue/retryRefundPayment/worker';
import { retryFindDriver } from './queue/retryFindingDrivers/worker';
import { bannedUserWorker } from './queue/bannedUser/worker';
import { retryTransferWorker } from './queue/retryTransfer/worker';

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
    console.error('expiry document worker error:', err);
  });

  reminderExpiredDocumentWorker.on('ready', () => {
    console.log('reminderExpiredDocument is ready');
  });

  reminderExpiredDocumentWorker.on('error', (err) => {
    console.error('reminderExpiredDocument error:', err);
  });

  vehicleValidatorWorker.on('ready', () => {
    console.log('vehicle Registeration Validator is ready');
  });

  vehicleValidatorWorker.on('error', (err) => {
    console.error('vehicle Registeration validator error:', err);
  });

  expiredCheckoutSessionWorer.on('ready', () => {
    console.log('expiredCheckoutSessionWorker is ready ');
  });

  expiredCheckoutSessionWorer.on('error', (err) => {
    console.error('expiredCheckoutsession worker error:', err);
  });

  expiredRequestWorker.on('ready', () => {
    console.log('expiredRequest worker is ready');
  });

  expiredRequestWorker.on('error', (err) => {
    console.error('expiredRequest worker has error:', err);
  });

  retryRefundPaymentWorker.on('ready', () => {
    console.log('retryRefundPayment worker is ready');
  });

  retryRefundPaymentWorker.on('error', (err) => {
    console.error('retryRefundPayment worker has error', err);
  });

  retryFindDriver.on('ready', () => {
    console.log('retryFind Driver worker is ready');
  });

  retryFindDriver.on('error', (err) => {
    console.error('retry find driver worker error:', err);
  });

  bannedUserWorker.on('ready', () => {
    console.log('bannedUser worker is ready ');
  });

  bannedUserWorker.on('error', (err) => {
    console.error('bannedUser worker error: ', err);
  });

  retryTransferWorker.on('ready', () => {
    console.log('retry transfer worker is ready');
  });

  retryTransferWorker.on('error', (err) => {
    console.error('retry transfer worker error: ', err);
  });
};
