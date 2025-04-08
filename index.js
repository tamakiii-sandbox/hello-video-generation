// Main script to generate video from audio and transcription
const path = require('path');
const AudioToVideoConverter = require('./src/audioToVideoConverter');

async function main() {
  // Create converter instance with default options
  const converter = new AudioToVideoConverter({
    fontFamily: 'Arial',
    fontSize: 36,  // Larger font for better readability
    fontColor: 'white',
    backgroundColor: 'black',
    width: 1280,
    height: 720
  });

  // Define file paths
  const audioPath = path.join(__dirname, 'example', '01-notebooklm-generated', 'GitHub Pull Request #1_ Initialize JSON-RPC 2_0.wav.wav');
  const transcriptionPath = path.join(__dirname, 'example', '01-notebooklm-generated', 'GitHub Pull Request #1_ Initialize JSON-RPC 2_0.wav.wav.en.txt');
  const outputPath = path.join(__dirname, 'example', '01-notebooklm-generated', 'output.mp4');

  try {
    console.log('Starting video generation...');
    console.log(`Audio file: ${audioPath}`);
    console.log(`Transcription file: ${transcriptionPath}`);
    console.log(`Output file: ${outputPath}`);

    // Generate the video
    await converter.convert(audioPath, transcriptionPath, outputPath);
    console.log('Video generation completed successfully!');
  } catch (error) {
    console.error('Failed to generate video:', error);
    process.exit(1);
  }
}

// Run the main function
main();