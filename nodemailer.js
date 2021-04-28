const nodemailer = require("nodemailer");

const mailService = (user) => {
  return new Promise((res, rej) => {
    const { firstName, lastName, email, token } = user;

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.SENDER_MAIL,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SENDER_MAIL,
      to: email,
      subject: "Hey! coder 👨‍💻",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Verification page</title>
        </head>
        <body>
            <h3>Hey ${firstName} ${lastName},</h3>
            <p> 
              We are happy you're here. Click the button below to activate your account.
            </p>
            <br />
            <a href="${process.env.BASE_URL}/users/verify?email=${email}&token=${token}" target="_blank"
            >Activate your account</a
            >
        </body>
        </html>    
    `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        rej(err);
      } else {
        res(info);
      }
    });
  });
};

module.exports = { mailService };
