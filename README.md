# Hello Video Generation

A Node.js tool to convert audio files and transcriptions into video files with subtitles.

## Prerequisites

- Node.js (v12 or higher)
- FFmpeg installed on your system (used for audio/video processing)

## Installation

1. Clone this repository:
```
git clone https://github.com/tamakiii-sandbox/hello-video-generation.git
cd hello-video-generation
```

2. Install dependencies:
```
npm install
```

## Usage

### Command-line Interface

The tool can be used directly from the command line:

```
./bin/generate <audio-file> <transcription-file> <output-file>
```

Arguments:
- `<audio-file>`: Path to the audio file
- `<transcription-file>`: Path to the transcription file (.txt or .srt)
- `<output-file>`: Path for the output video file (.mp4)

Example:
```
./bin/generate example/01-notebooklm-generated/input.wav example/01-notebooklm-generated/transcription.txt output.mp4
```

### Using npm start

You can also use npm start which will generate a video using the example files:

```
npm start
```

This will create a video file named `output.mp4` in the `example/01-notebooklm-generated` directory.

### Using as a Dependency

If you want to use this tool programmatically in another project, install it from GitHub:

```
npm install github:tamakiii-sandbox/hello-video-generation
```

Then use it in your code:

```javascript
const AudioToVideoConverter = require('hello-video-generation/src/audioToVideoConverter');

const converter = new AudioToVideoConverter({
  fontFamily: 'Arial',
  fontSize: 36,
  fontColor: 'white',
  backgroundColor: 'black',
  width: 1280,
  height: 720
});

// Convert audio and transcription to video
converter.convert('path/to/audio.wav', 'path/to/transcription.txt', 'output.mp4')
  .then(() => console.log('Video created successfully!'))
  .catch(err => console.error('Error:', err));
```

## File Formats

- **Audio files**: Any format supported by FFmpeg (WAV, MP3, M4A, etc.)
- **Transcription files**: Plain text (.txt) or SRT subtitle format (.srt)

## License

ISC