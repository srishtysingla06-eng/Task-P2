require("dotenv").config();

const path = require("path");
const express = require("express");
const sgMail = require("@sendgrid/mail");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Stores valid subscription submissions and their email-delivery status.
// This is an in-memory array, so it resets when the server restarts.
const subscribers = [];

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

if (apiKey) {
  sgMail.setApiKey(apiKey);
} else {
  console.warn("SENDGRID_API_KEY is not set. Email sending is disabled until it is configured.");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    sendGridConfigured: Boolean(apiKey && fromEmail),
    subscriberCount: subscribers.length
  });
});

app.post("/subscribe", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return res.status(400).send("Please enter a valid email address.");
  }

  const existingSubscriber = subscribers.find((subscriber) => subscriber.email === email);
  if (existingSubscriber && existingSubscriber.emailStatus !== "failed") {
    return res.status(409).send("This email address has already been submitted.");
  }

  if (!apiKey || !fromEmail) {
    console.error("SendGrid is not configured. Check SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in .env.");
    return res.status(500).send("The subscription service is not configured. Please try again later.");
  }

  // Record the valid submission before contacting SendGrid. The status is
  // updated below so the array clearly distinguishes sent and failed emails.
  const subscriberRecord = {
    email,
    emailStatus: "pending",
    sendGridStatusCode: null,
    submittedAt: new Date().toISOString()
  };
  subscribers.push(subscriberRecord);

  const message = {
    to: email,
    from: fromEmail,
    subject: "Welcome to DEV@Deakin!",
    text: "Thank you for subscribing to the DEV@Deakin Daily Insider! We're excited to have you with us!",
    html: `
      <h1>Welcome to DEV@Deakin!</h1>
      <p>Thank you for subscribing to our Daily Insider.</p>
      <p>We're excited to have you with us!</p>
    `
  };

  try {
    // SendGrid returns a response object containing its HTTP status code.
    const [sendGridResponse] = await sgMail.send(message);
    const sendGridStatusCode = sendGridResponse.statusCode;

    subscriberRecord.emailStatus = "sent";
    subscriberRecord.sendGridStatusCode = sendGridStatusCode;

    console.log("Welcome email sent successfully.");
    console.log("SendGrid status code:", sendGridStatusCode);
    console.log("Subscribers:", subscribers);

    return res.status(200).send(
      `Subscription successful! Welcome email sent. SendGrid status: ${sendGridStatusCode}.`
    );
  } catch (error) {
    const sendGridStatusCode = error.response?.statusCode || error.code || "Unknown";

    console.error("SendGrid request failed.");
    console.error("SendGrid status code:", sendGridStatusCode);
    subscriberRecord.emailStatus = "failed";
    subscriberRecord.sendGridStatusCode = sendGridStatusCode;

    console.error("SendGrid error details:", error.response?.body || error.message || error);
    console.log("Subscribers:", subscribers);

    return res.status(502).send(
      "Your subscription could not be completed because the welcome email was not sent. Please try again later."
    );
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
