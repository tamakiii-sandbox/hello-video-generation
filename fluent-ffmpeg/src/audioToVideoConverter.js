// Audio to Video Converter with Transcription
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const srtParser = require('subtitles-parser');
const { execSync } = require('child_process');

class AudioToVideoConverter {
  constructor(options = {}) {
    this.options = {
      fontFamily: 'Arial',
      fontSize: 24,
      fontColor: 'white',
      backgroundColor: 'black',
      width: 1280,
      height: 720,
      backgroundImage: null, // Add support for a background image path
      ...options
    };
  }

  /**
   * Convert audio and transcription to video
   * @param {string} audioPath - Path to audio file
   * @param {string} transcriptionPath - Path to transcription file (.srt or .txt)
   * @param {string} outputPath - Path for output video
   * @returns {Promise} - Promise that resolves when conversion is complete
   */
  async convert(audioPath, transcriptionPath, outputPath) {
    try {
      // Verify files exist
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }
      if (!fs.existsSync(transcriptionPath)) {
        throw new Error(`Transcription file not found: ${transcriptionPath}`);
      }
      
      // Verify background image exists if provided
      if (this.options.backgroundImage && !fs.existsSync(this.options.backgroundImage)) {
        throw new Error(`Background image not found: ${this.options.backgroundImage}`);
      }

      // Ensure the output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
      }

      // Check file extensions
      const transcriptionExt = path.extname(transcriptionPath).toLowerCase();
      
      // Parse transcription based on format
      let subtitles;
      if (transcriptionExt === '.srt') {
        // Parse SRT file
        const srtData = fs.readFileSync(transcriptionPath, 'utf8');
        subtitles = srtParser.fromSrt(srtData);
      } else {
        // Read file content
        const text = fs.readFileSync(transcriptionPath, 'utf8');
        
        // Check if the file contains WebVTT-like format with timestamps in square brackets
        if (text.match(/\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]/)) {
          console.log('Detected WebVTT-like format, parsing timestamps...');
          subtitles = this._parseWebVTTLikeFormat(text);
        } else {
          // Assume plain text with simple transcription
          console.log('Processing as plain text without timestamps...');
          subtitles = await this._textToSubtitles(text, audioPath);
        }
      }

      console.log(`Parsed ${subtitles.length} subtitle entries`);
      
      // Create temporary subtitle file
      const tempSrtPath = path.join(outputDir, `temp_${path.basename(outputPath)}.srt`);
      fs.writeFileSync(tempSrtPath, srtParser.toSrt(subtitles));
      console.log(`Created temporary SRT file: ${tempSrtPath}`);

      // Get audio duration
      const audioDuration = await this._getAudioDuration(audioPath);
      console.log(`Audio duration: ${audioDuration} seconds`);

      // Determine the background image to use
      let backgroundImagePath;
      if (this.options.backgroundImage) {
        // Use provided background image
        backgroundImagePath = this.options.backgroundImage;
        console.log(`Using provided background image: ${backgroundImagePath}`);
      } else {
        // Create a simple black PNG file using direct FFmpeg command
        backgroundImagePath = path.join(outputDir, `bg_${path.basename(outputPath)}.png`);
        this._createBlackImage(backgroundImagePath);
        console.log(`Created black background image: ${backgroundImagePath}`);
      }

      // Use FFmpeg to create video from audio and add subtitles
      return new Promise((resolve, reject) => {
        // First create a video from the image with the same duration as the audio
        console.log('Creating video from background image and audio...');
        
        // Ensure subtitle path is properly escaped for FFmpeg
        const escapedSrtPath = tempSrtPath.replace(/'/g, "'\\''").replace(/:/g, '\\:');
        
        ffmpeg()
          // Use the background image
          .input(backgroundImagePath)
          .inputOptions(['-loop 1'])  // Loop the image
          .input(audioPath)           // Add the audio
          .outputOptions([
            `-t ${audioDuration}`,    // Set the duration of the video
            '-c:v libx264',           // Video codec
            '-tune stillimage',       // Optimize for still image
            '-c:a aac',               // Audio codec
            '-b:a 192k',              // Audio bitrate
            '-pix_fmt yuv420p',       // Pixel format for better compatibility
            '-vf',                    // Video filter
            // Use simpler subtitle styling to ensure compatibility
            `subtitles=${escapedSrtPath}`
          ])
          .save(outputPath)
          .on('end', () => {
            // Clean up temporary files
            console.log('Cleaning up temporary files...');
            // fs.unlinkSync(tempSrtPath);
            // Don't delete the background image if it was provided by the user
            // if (!this.options.backgroundImage) {
            //   fs.unlinkSync(backgroundImagePath);
            // }
            console.log(`Video generated successfully: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('Error creating video:', err);
            reject(err);
          });
      });
    } catch (error) {
      console.error('Conversion error:', error);
      throw error;
    }
  }

  /**
   * Parse WebVTT-like format with timestamps in square brackets
   * @param {string} text - Text content with timestamps in format [00:00:00.000 --> 00:00:00.000]
   * @returns {Array} - Array of subtitle objects
   */
  _parseWebVTTLikeFormat(text) {
    const lines = text.split('\n');
    const subtitles = [];
    
    let id = 1;
    
    for (const line of lines) {
      // Look for timestamp pattern [00:00:00.000 --> 00:00:00.000]
      const match = line.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\](.*)/);
      
      if (match) {
        const startTime = match[1].replace('.', ','); // SRT uses comma for milliseconds
        const endTime = match[2].replace('.', ',');   // SRT uses comma for milliseconds
        const captionText = match[3].trim();
        
        subtitles.push({
          id: id++,
          startTime: startTime,
          endTime: endTime,
          text: captionText
        });
      }
    }
    
    return subtitles;
  }

  /**
   * Create a black PNG image using direct FFmpeg command
   * @param {string} outputPath - Path to save the image
   */
  _createBlackImage(outputPath) {
    // Create a simple black image using FFmpeg command line
    const command = `ffmpeg -f lavfi -i color=c=black:s=${this.options.width}x${this.options.height} -frames:v 1 "${outputPath}"`;
    try {
      console.log(`Running command: ${command}`);
      execSync(command);
      return true;
    } catch (error) {
      console.error('Error creating black image:', error);
      // Fallback to creating a file directly if FFmpeg command fails
      this._createSimpleBlackImage(outputPath);
    }
  }

  /**
   * Create a simple black PNG file directly (fallback)
   * @param {string} outputPath - Path to save the image
   */
  _createSimpleBlackImage(outputPath) {
    // Create a very simple 1x1 black PNG file as a fallback
    // This is a minimal valid PNG file with black pixel
    const blackPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    fs.writeFileSync(outputPath, Buffer.from(blackPngBase64, 'base64'));
    console.log('Created fallback black image using base64 encoded PNG');
  }

  /**
   * Convert plain text to subtitle format
   * @param {string} text - Full transcription text
   * @param {string} audioPath - Path to audio file to get duration
   * @returns {Array} - Array of subtitle objects
   */
  async _textToSubtitles(text, audioPath) {
    // Split text into sentences or chunks
    const lines = text.split(/[.!?]\s+/).filter(line => line.trim());
    
    // Get audio duration
    const audioLength = await this._getAudioDuration(audioPath);
    const approxTimePerLine = audioLength / lines.length;
    
    return lines.map((line, index) => {
      const startTime = index * approxTimePerLine;
      const endTime = (index + 1) * approxTimePerLine;
      
      return {
        id: index + 1,
        startTime: this._formatTime(startTime * 1000), // Convert to milliseconds
        endTime: this._formatTime(endTime * 1000),
        text: line.trim()
      };
    });
  }

  /**
   * Get duration of audio file in seconds
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<number>} - Promise that resolves with duration in seconds
   */
  _getAudioDuration(audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(metadata.format.duration);
      });
    });
  }

  /**
   * Format time for SRT file
   * @param {number} ms - Time in milliseconds
   * @returns {string} - Formatted time string (HH:MM:SS,mmm)
   */
  _formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  }

  /**
   * Convert RGB color to hex
   * @param {string} color - Color name or hex value
   * @returns {string} - Hex color value
   */
  _rgbToHex(color) {
    // Simple color conversion - in a real implementation, you would handle color names properly
    return color.startsWith('#') ? color : '#ffffff';
  }
}

module.exports = AudioToVideoConverter;
