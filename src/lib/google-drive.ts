import { google } from "googleapis";
import { Readable } from "stream";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
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
