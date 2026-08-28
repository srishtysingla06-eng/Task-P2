require("dotenv").config();

const express = require("express");
const sgMail = require("@sendgrid/mail");

const app = express();

const PORT = 3000;

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Serve files from public folder
app.use(express.static("public"));

// Read form data
app.use(express.urlencoded({ extended: true }));

// Handle subscription form
app.post("/subscribe", async (req, res) => {

    const email = req.body.email;

    console.log("Subscriber email:", email);

    const message = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: "Welcome to DEV@Deakin!",
        text: "Thank you for subscribing to the DEV@Deakin Daily Insider!",
        html: `
            <h1>Welcome to DEV@Deakin!</h1>
            <p>Thank you for subscribing to our Daily Insider.</p>
            <p>We're excited to have you with us!</p>
        `
    };

    try {

        await sgMail.send(message);

        console.log("Welcome email sent successfully.");

        res.send("Subscription successful! Check your email.");

    } catch (error) {

        console.error("SendGrid error:", error.response?.body || error);

        res.status(500).send("Subscription received, but the email could not be sent.");

    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});