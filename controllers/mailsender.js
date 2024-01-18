var nodemailer = require('nodemailer');



// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  secure: true, // true for 465, false for other ports
  logger: true,
  debug: true,
  port: 587,
  secureConnection: false,             
  host: "smtp.gmail.com",
     auth: {
          user: 'Rohans17we@gmail.com',
          pass: 'gglrcsjybhaqpwje',
       },
      tls: {
        rejectUnAuthorized:false
        }
  });

// Function to send the email
function sendEmail(toEmail, subject, message) {
  const mailOptions = {
    from: 'demononmission@gmail.com',
    to: toEmail,
    subject: subject,
    text: message
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

module.exports = {
  sendEmail: sendEmail
};
