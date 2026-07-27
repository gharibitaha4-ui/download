import { NextRequest } from 'next/server';
import { exec } from 'yt-dlp-exec';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const formatId = searchParams.get('format_id');
  const type = searchParams.get('type') || 'video'; // 'video' or 'audio'

  if (!url || !formatId) {
    return new Response('URL and format_id are required', { status: 400 });
  }

  try {
    // Determine args based on whether we want to extract audio or just download the format
    let args: any = {
      f: formatId,
      o: '-', // output to stdout
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
    };

    if (type === 'audio') {
      // If audio is requested, extract audio and convert to mp3
      args = {
        ...args,
        extractAudio: true,
        audioFormat: 'mp3',
        // When extracting audio, outputting to stdout as mp3 requires some specific handling in yt-dlp
        // yt-dlp can output to stdout.
      };
    }

    const process = exec(url, args);

    // Create a ReadableStream from the child process stdout
    const stream = new ReadableStream({
      start(controller) {
        process.stdout?.on('data', (chunk) => {
          controller.enqueue(chunk);
        });

        process.stdout?.on('end', () => {
          controller.close();
        });

        process.stderr?.on('data', (data) => {
          console.log(`yt-dlp stderr: ${data}`);
        });

        process.on('close', (code) => {
          if (code !== 0 && code !== null) {
            console.error(`yt-dlp process exited with code ${code}`);
            // If the stream isn't closed, close it on error
            try { controller.close(); } catch {}
          }
        });
        
        process.on('error', (err) => {
           console.error('yt-dlp process error:', err);
           controller.error(err);
        });
      },
      cancel() {
        process.kill();
      }
    });

    const filename = `download-${Date.now()}.${type === 'audio' ? 'mp3' : 'mp4'}`;

    return new Response(stream, {
      headers: {
        'Content-Type': type === 'audio' ? 'audio/mpeg' : 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        // We can't provide Content-Length easily when streaming stdout
      },
    });

  } catch (error: any) {
    console.error('Error in download route:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
