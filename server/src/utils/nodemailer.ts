import nodemailer, { SendMailOptions } from 'nodemailer';
import config from '../config/config';
import { MailOptions } from 'nodemailer/lib/sendmail-transport';

export const SendEmail = async (option: SendMailOptions) => {
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    service: config.email.service,
    port: config.email.port,
    auth: {
      user: config.email.auth.user,
      pass: config.email.auth.password,
    },
  });

  const mailOption: MailOptions = {
    from: config.email.from,
    to: option.to,
    subject: option.subject,
    html: option.html,
    text: option.text,
    attachments: option.attachments,
  };

  transporter.sendMail(mailOption, function (err, infoText) {
    if (err) {
      console.log(err);
    } else {
      console.log(infoText);
    }
  });
};
