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
    const hasCookies = fs.existsSync(secretCookiesPath);

    const baseOptions: Record<string, any> = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
    };

    let output: any;

    try {
      // Attempt 1: spoof Android client (khfif, bla cookies, kayt7al m3a bezaf videos)
      output = await ytDlp(videoUrl, {
        ...baseOptions,
        extractorArgs: 'youtube:player_client=android',
      });
    } catch (firstError: any) {
      const isBotBlock =
        firstError?.stderr?.includes('Sign in to confirm') ||
        firstError?.message?.includes('Sign in to confirm');

      if (isBotBlock && hasCookies) {
        // Attempt 2: fallback l cookies ila kayn bot detection
        output = await ytDlp(videoUrl, {
          ...baseOptions,
          cookies: secretCookiesPath,
        });
      } else {
        throw firstError;
      }
    }

    // Khtar ahsen format (video + audio flen), machi ghi akher wa7d f array
    const bestFormat =
      output.formats
        ?.filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none')
        ?.pop() || output.formats?.pop();

    const downloadUrl = output.url || bestFormat?.url;

    if (!downloadUrl) {
      return NextResponse.json({ error: 'Could not extract direct video URL' }, { status: 400 });
    }

    return NextResponse.json({
      title: output.title,
      thumbnail: output.thumbnail,
      duration: output.duration,
      downloadUrl,
    });
  } catch (error: any) {
    console.error('yt-dlp error:', error);
    return NextResponse.json(
      { error: error?.stderr || error?.message || 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
