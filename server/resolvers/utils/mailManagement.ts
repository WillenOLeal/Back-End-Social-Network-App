import * as nodemailer from 'nodemailer'; 
import * as nodemailerSendgrid from 'nodemailer-sendgrid';


export const sendConfirmationEmail = (email: string, url: string) => {

    const transport = nodemailer.createTransport(
        nodemailerSendgrid({
            apiKey: process.env.SENDGRID_API_KEY
        })
    );
    
    transport.sendMail({
        from: process.env.SENDGRID_VERIFIED_EMAIL,
        to: email,
        subject: 'Confirm Your Account',
        html: `<h3>Welcome Abord!</h3>
               <p>Confirm Account:</p>
               <a href=${url}>Confirm</a>`
    }).catch(err => console.log(err))
}
   