import { NextResponse } from 'next/server';
import ytDlp from 'yt-dlp-exec';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // 1. Path dyal cookies file f server
    const cookiesPath = path.join(process.cwd(), 'cookies.txt');

    // 2. Ila kan YOUTUBE_COOKIES f Render Environment Variables, n-ktboha f cookies.txt
    if (process.env.YOUTUBE_COOKIES && !fs.existsSync(cookiesPath)) {
      fs.writeFileSync(cookiesPath, process.env.YOUTUBE_COOKIES);
    }

    // 3. Options dyal yt-dlp bash y-fayt l-bot detection dyal YouTube
    const options: Record<string, any> = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      // User Agent dyal browser 3adi
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Had l-line kat-khelli YouTube y-shoufk bhal Android App w ma-y-tlobch login
      extractorArgs: 'youtube:player_client=android,web',
    };

    // Ila kan cookies file kayn, passih l yt-dlp
    if (fs.existsSync(cookiesPath)) {
      options.cookies = cookiesPath;
    }

    // Run yt-dlp
    const output = await ytDlp(videoUrl, options);

    return NextResponse.json(output);

  } catch (error: any) {
    console.error('yt-dlp error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to extract video info' },
      { status: 500 }
    );
  }
}
