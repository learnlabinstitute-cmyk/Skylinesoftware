import { getGoogleAccessToken } from './googleAuth';
import { BabyProfile } from '../types';

export interface SheetGuest {
  name: string;
  status: 'Attending' | 'Invited' | 'Maybe' | 'Declined';
  adults: number;
  kids: number;
  phone: string;
  email: string;
  dietaryNotes: string;
  invitationSent: boolean;
  giftWishes: string;
  rowIndex?: number; // 1-based index in the sheet
}

export interface SpreadsheetMeta {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * List spreadsheets from the user's Google Drive
 */
export async function listGoogleDriveSpreadsheets(): Promise<SpreadsheetMeta[]> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list spreadsheets: ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Create a brand-new formatted Birthday Party Guest & RSVP Spreadsheet
 */
export async function createBirthdaySpreadsheet(profile: BabyProfile): Promise<SpreadsheetMeta> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const sheetTitle = `${profile.name || 'Baby'}'s 1st Birthday - Guest & RSVP Tracker`;

  // 1. Create Spreadsheet via Google Sheets API v4
  const createPayload = {
    properties: {
      title: sheetTitle,
    },
    sheets: [
      {
        properties: {
          title: 'Guest List & RSVPs',
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 10,
          },
        },
      },
      {
        properties: {
          title: 'Party Details',
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 3,
          },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${err}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Populate Headers and Initial Sample Data in "Guest List & RSVPs"
  const headers = [
    'Guest / Family Name',
    'RSVP Status',
    'Adults',
    'Kids',
    'Phone / WhatsApp',
    'Email Address',
    'Dietary / Special Notes',
    'Invitation Sent',
    'Gift / Wishes Note',
  ];

  const initialRows = [
    headers,
    ['Uncle John & Family', 'Attending', '2', '1', '+1 555-0192', 'john@example.com', 'Vegetarian', 'Yes', 'Baby explorer toys'],
    ['Aunt Sarah & David', 'Attending', '2', '0', '+1 555-0144', 'sarah@example.com', 'None', 'Yes', 'Picture story book'],
    ['Grandma & Grandpa', 'Attending', '2', '0', '+1 555-0188', 'family@example.com', 'None', 'Yes', 'Silver keepsake'],
    ['Miller Family', 'Maybe', '2', '2', '+1 555-0177', 'miller@example.com', 'Gluten Free', 'Yes', 'Wooden train set'],
    ['Elena Gomez', 'Invited', '1', '0', '+1 555-0166', 'elena@example.com', 'None', 'Pending', ''],
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Guest List & RSVPs'!A1:I6?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: initialRows }),
  });

  // 3. Populate "Party Details" tab
  const partyRows = [
    ['Field', 'Details', 'Notes'],
    ['Child Name', profile.name || 'Baby', 'Turning 1 Year Old'],
    ['Celebration Date', profile.date, 'Day & Date'],
    ['Time', profile.time, 'Event time'],
    ['Venue Name', profile.venueName, 'Location name'],
    ['Venue Address', profile.venueAddress, 'Address'],
    ['Parents', profile.parentsNames, 'Hosts'],
    ['Grandparents', profile.grandparentsNames || '', 'Blessings'],
    ['Theme', profile.themeId === 'jungle_safari' ? 'Jungle Safari 3D' : profile.themeId, 'Invitation theme'],
    ['Invitation Verse', profile.customVerse, 'Celebratory poem'],
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Party Details'!A1:C10?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: partyRows }),
  });

  // 4. Format Header Row with pleasant celebratory emerald styling
  const firstSheetId = sheetData.sheets?.[0]?.properties?.sheetId || 0;
  const formatPayload = {
    requests: [
      {
        repeatCell: {
          range: {
            sheetId: firstSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 9,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.1, green: 0.45, blue: 0.25 },
              textFormat: {
                foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                bold: true,
                fontSize: 11,
              },
              horizontalAlignment: 'CENTER',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      },
    ],
  };

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formatPayload),
  });

  return {
    id: spreadsheetId,
    name: sheetTitle,
    webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Read guests from a spreadsheet
 */
export async function readSpreadsheetGuests(spreadsheetId: string): Promise<SheetGuest[]> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  // Find sheet name
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error('Failed to access spreadsheet');
  const meta = await metaRes.json();
  const sheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A2:I100`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!valuesRes.ok) throw new Error('Failed to read values from spreadsheet');
  const valuesData = await valuesRes.json();
  const rows = valuesData.values || [];

  return rows.map((row: string[], index: number): SheetGuest => {
    const rawStatus = (row[1] || 'Invited').trim();
    let status: 'Attending' | 'Invited' | 'Maybe' | 'Declined' = 'Invited';
    if (/attending|yes|confirmed/i.test(rawStatus)) status = 'Attending';
    else if (/maybe|tentative/i.test(rawStatus)) status = 'Maybe';
    else if (/declined|no|cannot/i.test(rawStatus)) status = 'Declined';

    return {
      rowIndex: index + 2, // 1-based index (row 1 is header)
      name: row[0] || 'Guest',
      status,
      adults: parseInt(row[2]) || 1,
      kids: parseInt(row[3]) || 0,
      phone: row[4] || '',
      email: row[5] || '',
      dietaryNotes: row[6] || '',
      invitationSent: /yes|sent|true/i.test(row[7] || ''),
      giftWishes: row[8] || '',
    };
  });
}

/**
 * Append a new guest row to the spreadsheet
 */
export async function appendGuestToSheet(spreadsheetId: string, guest: SheetGuest): Promise<void> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const rowValues = [
    guest.name,
    guest.status,
    guest.adults.toString(),
    guest.kids.toString(),
    guest.phone,
    guest.email,
    guest.dietaryNotes,
    guest.invitationSent ? 'Yes' : 'Pending',
    guest.giftWishes,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Guest List & RSVPs'!A:I:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [rowValues] }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to append guest: ${err}`);
  }
}

/**
 * Update an existing guest row in the spreadsheet
 */
export async function updateGuestInSheet(
  spreadsheetId: string,
  rowIndex: number,
  guest: SheetGuest
): Promise<void> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const rowValues = [
    guest.name,
    guest.status,
    guest.adults.toString(),
    guest.kids.toString(),
    guest.phone,
    guest.email,
    guest.dietaryNotes,
    guest.invitationSent ? 'Yes' : 'Pending',
    guest.giftWishes,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Guest List & RSVPs'!A${rowIndex}:I${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [rowValues] }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update guest: ${err}`);
  }
}
