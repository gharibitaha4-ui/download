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
    const secretCookiesPath = '/etc/secrets/cookies.txt';

    const options: Record<string, any> = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      // Pass cookies for YouTube if available
      ...(fs.existsSync(secretCookiesPath) && { cookies: secretCookiesPath }),
    };

    // 1. Fetch info JSON from yt-dlp
    const output: any = await ytDlp(videoUrl, options);

    // 2. Extract l-Direct Video Link & Meta Info
    const downloadUrl = output.url || (output.formats && output.formats.pop()?.url);

    if (!downloadUrl) {
      return NextResponse.json({ error: 'Could not extract direct video URL' }, { status: 400 });
    }

    // 3. Return Clean JSON Data l-Frontend (Machi raw dump)
    return NextResponse.json({
      title: output.title,
      thumbnail: output.thumbnail,
      duration: output.duration,
      downloadUrl: downloadUrl, // 👈 Hada hwa direct link dyal MP4
    });

  } catch (error: any) {
    console.error('yt-dlp error:', error);
    return NextResponse.json(
      { error: error?.stderr || error?.message || 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
