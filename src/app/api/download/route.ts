import { NextResponse } from 'next/server';
import ytDlp from 'yt-dlp-exec';
import fs from 'fs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Path dyal secret file f Render
    const secretCookiesPath = '/etc/secrets/cookies.txt';
    // Path dyal local cookies (ila knti kat-jrb f PC dyalak)
    const localCookiesPath = './cookies.txt';

    const options: Record<string, any> = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      extractorArgs: 'youtube:player_client=android,web',
    };

    // Kay-t-verifya wach cookies kaynin f Render Secret Files
    if (fs.existsSync(secretCookiesPath)) {
      options.cookies = secretCookiesPath;
    } else if (fs.existsSync(localCookiesPath)) {
      options.cookies = localCookiesPath;
    }

    // Execution dyal yt-dlp b options l-jddad
    const output = await ytDlp(videoUrl, options);

    return NextResponse.json(output);

  } catch (error: any) {
    console.error('yt-dlp error:', error);
    return NextResponse.json(
      { error: error?.stderr || error?.message || 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
