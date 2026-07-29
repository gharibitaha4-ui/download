const ytDlp = require('yt-dlp-exec');

async function run() {
  try {
    const info = await ytDlp('https://www.youtube.com/watch?v=jNQXAC9IVRw', {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
    });
    console.log("SUCCESS");
    console.log(info.title);
  } catch (err) {
    console.log("ERROR OCCURRED:");
    console.error(err);
  }
}

run();
