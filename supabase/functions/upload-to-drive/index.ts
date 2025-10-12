
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/base64url.ts";

// --- Configuration ---
const SERVICE_ACCOUNT_JSON_STR = Deno.env.get("SERVICE_ACCOUNT_JSON");
const FOLDER_ID = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");
const GOOGLE_AUTH_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token";
// UPDATED: Added supportsAllDrives=true to handle Shared Drives
const GOOGLE_UPLOAD_URI = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Helper Functions ---

async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  const pem = pemKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const binaryDer = atob(pem);
  const arrayBuffer = new Uint8Array(binaryDer.length).map((_, i) => binaryDer.charCodeAt(i));
  return crypto.subtle.importKey(
    "pkcs8",
    arrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  );
}

async function createSignedJwt(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccount.client_email,
    scope: GOOGLE_AUTH_SCOPE,
    aud: GOOGLE_TOKEN_URI,
    exp: now + 3600,
    iat: now,
  };

  const signingInput = `${encode(JSON.stringify(header))}.${encode(JSON.stringify(claims))}`;
  const privateKey = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(signingInput));
  return `${signingInput}.${encode(signature)}`;
}

async function getAccessToken(serviceAccount: any): Promise<string> {
    console.log("Attempting to get access token...");
    const jwt = await createSignedJwt(serviceAccount);

    const response = await fetch(GOOGLE_TOKEN_URI, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to fetch access token:", response.status, errorBody);
        throw new Error(`Failed to fetch access token: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    console.log("Successfully obtained access token.");
    return data.access_token;
}

// --- Main Server Logic ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("--- New Request ---");

  try {
    // 1. Check Environment Variables
    if (!SERVICE_ACCOUNT_JSON_STR || !FOLDER_ID) {
      console.error("Missing environment variables: SERVICE_ACCOUNT_JSON or GOOGLE_DRIVE_FOLDER_ID");
      return new Response("Server configuration error", { status: 500, headers: corsHeaders });
    }
    const SERVICE_ACCOUNT_JSON = JSON.parse(SERVICE_ACCOUNT_JSON_STR);
    console.log("Environment variables loaded.");

    // 2. Get File from Request
    const file = (await req.formData()).get("file") as File;
    if (!file) {
      console.log("File not provided in request.");
      return new Response("File not provided", { status: 400, headers: corsHeaders });
    }
    console.log(`Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // 3. Authenticate with Google
    const accessToken = await getAccessToken(SERVICE_ACCOUNT_JSON);

    // 4. Construct Multipart Upload Request
    const metadata = { name: file.name, parents: [FOLDER_ID] };
    const boundary = `----${crypto.randomUUID().replace(/-/g, "")}`;
    const bodyPrefix = new TextEncoder().encode(
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`
    );
    const bodySuffix = new TextEncoder().encode(`\r\n--${boundary}--`);

    const combinedStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(bodyPrefix);
        for await (const chunk of file.stream()) {
          controller.enqueue(chunk);
        }
        controller.enqueue(bodySuffix);
        controller.close();
      }
    });
    console.log("Multipart body stream created.");

    // 5. Upload to Google Drive
    console.log("Attempting to upload to Google Drive...");
    const uploadResponse = await fetch(GOOGLE_UPLOAD_URI, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: combinedStream,
      // Duplex stream is required for streaming request bodies
      // @ts-ignore
      duplex: 'half'
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text(); // Use .text() to get raw response
      console.error("Google Drive upload failed. Status:", uploadResponse.status, "Body:", errorBody);
      throw new Error(`Google Drive upload failed: ${errorBody}` );
    }

    const result = await uploadResponse.json();
    console.log("File uploaded successfully! File ID:", result.id);

    return new Response(JSON.stringify({ fileId: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unhandled error in function execution:", error.message);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
