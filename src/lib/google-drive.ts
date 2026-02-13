import { google } from "googleapis";
import { Readable } from "stream";

function getOAuth2Client() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
      "Missing Google OAuth environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI must be set"
    );
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });
}

export async function handleCallback(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string | undefined,
  tokens: { accessToken: string; refreshToken: string; expiryDate: number }
) {
  const client = getOAuth2Client();
  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
  });

  let refreshedTokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null } | null = null;
  client.on("tokens", (t) => {
    refreshedTokens = t;
  });

  const drive = google.drive({ version: "v3", auth: client });

  const requestBody: { name: string; parents?: string[] } = { name: fileName };
  if (folderId) {
    requestBody.parents = [folderId];
  }

  const response = await drive.files.create({
    requestBody,
    media: {
      mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: "id, webViewLink",
  });

  return {
    driveFileId: response.data.id,
    webViewLink: response.data.webViewLink,
    refreshedTokens,
  };
}

export async function checkConnection(tokens: {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}): Promise<boolean> {
  try {
    const client = getOAuth2Client();
    client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate,
    });

    const drive = google.drive({ version: "v3", auth: client });
    await drive.files.list({ pageSize: 1 });
    return true;
  } catch {
    return false;
  }
}
