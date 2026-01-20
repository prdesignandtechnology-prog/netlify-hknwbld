// netlify/functions/submit-lead.js
const admin = require('firebase-admin');

// 1. Decode your service account from an Environment Variable
// (See setup instructions below)
if (!admin.apps.length) {
  // Check if we are running locally or on Netlify
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { businessName, email } = data;

    // Validate inputs
    if (!businessName || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
    }

    // 1. Write to Firestore (Admin SDK bypasses client rules)
    await db.collection('leads').add({
      business_name: businessName,
      contact_email: email,
      region: 'SLC_COUNTY',
      status: 'new',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      source: 'static_site_v1'
    });

    // 2. (Optional) Trigger Email Logic here (e.g. SendGrid, Postmark)
    // or rely on a Firebase Cloud Function trigger watching the 'leads' collection

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Lead captured successfully" })
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
