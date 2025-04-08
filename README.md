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

### Using the example files

To generate a video using the example audio and transcription files included in this repository:

```
npm start
```

This will create a video file named `output.mp4` in the `example/01-notebooklm-generated` directory.

### Using your own files

To use your own audio and transcription files, modify the `index.js` file and update the file paths:

```javascript
const audioPath = path.join(__dirname, 'path/to/your/audio.wav');
const transcriptionPath = path.join(__dirname, 'path/to/your/transcription.txt');
const outputPath = path.join(__dirname, 'path/to/output.mp4');
```

You can also customize the video appearance by modifying the converter options:

```javascript
const converter = new AudioToVideoConverter({
  fontFamily: 'Arial',
  fontSize: 36,
  fontColor: 'white',
  backgroundColor: 'black',
  width: 1280,
  height: 720
});
```

## File Formats

- **Audio files**: Any format supported by FFmpeg (WAV, MP3, M4A, etc.)
- **Transcription files**: Plain text (.txt) or SRT subtitle format (.srt)

## License

ISC