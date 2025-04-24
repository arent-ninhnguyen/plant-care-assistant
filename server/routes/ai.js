const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash"; // Or another suitable Gemini model

if (!GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY environment variable is not set.');
  // Optionally exit or throw an error to prevent the route from being used without a key
  // process.exit(1); 
}

// --- Multer Configuration for temporary analysis uploads ---
const analysisUploadDir = path.join(__dirname, '..', 'temp_uploads', 'analysis');
if (!fs.existsSync(analysisUploadDir)){
    fs.mkdirSync(analysisUploadDir, { recursive: true });
}

const analysisStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, analysisUploadDir);
  },
  filename: function (req, file, cb) {
    // Simple unique name for temporary file
    const uniqueSuffix = 'analyze-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  }
});

const analysisUpload = multer({ 
  storage: analysisStorage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit for analysis images
  fileFilter: (req, file, cb) => { // Allow common image types
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
}).single('plantImage'); // Expecting field named 'plantImage' from frontend

// --- Google AI Client Initialization ---
let genAI;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
  console.warn('Google AI Client not initialized due to missing API key.');
}

// --- Helper Functions ---
// Function to convert file buffer to generative part
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// --- API Endpoint: Analyze Plant Status ---
router.post('/analyze-plant-status', (req, res, next) => {
  if (!genAI) {
    return res.status(500).json({ error: 'AI Service is not configured (missing API key).' });
  }

  analysisUpload(req, res, async (err) => {
    if (err) {
      console.error('Multer error during analysis upload:', err);
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      } else {
        return res.status(400).json({ error: err.message }); // e.g., wrong file type
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded for analysis.' });
    }

    // --- Get language from request body (sent via FormData) ---
    const requestedLanguage = req.body.language || 'English'; // Default to English
    console.log(`Requested analysis language: ${requestedLanguage}`);

    const tempFilePath = req.file.path;
    const mimeType = req.file.mimetype;

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const generationConfig = {
        temperature: 0.4, // Adjust for creativity vs. factualness
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192, // Adjust as needed
      };
      
      // Safety settings - adjust as necessary for plant-related content
      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];

      // --- MODIFIED: Dynamically add language instruction to prompt ---
      const basePrompt = `Analyze the health of the plant or flower shown in this image. Focus specifically on visible signs related to its well-being. 
      1.  **Overall Assessment:** Briefly describe the overall apparent health (e.g., healthy, stressed, showing issues).
      2.  **Potential Issues:** Identify any specific potential problems visible in the image (e.g., for plants: yellowing leaves, drooping, spots, pests, signs of under/over-watering; for flowers: wilting, discoloration, pests, spots). Be specific if possible.
      3.  **Care Suggestions:** Based ONLY on the visual evidence in the image, provide 1-3 concise, actionable care suggestions. Prioritize the most likely needed actions.
      
      Format the output clearly using markdown headings for each section (Overall Assessment, Potential Issues, Care Suggestions). If no specific issues are visible, state that the plant or flower appears healthy.`;
      
      const finalPrompt = `${basePrompt}

Please provide the response in ${requestedLanguage}.`; // Add language instruction

      const imageBuffer = fs.readFileSync(tempFilePath);
      const imagePart = fileToGenerativePart(imageBuffer, mimeType);
      const parts = [ { text: finalPrompt }, imagePart ]; // Use final prompt

      console.log(`Sending request to Gemini model (${MODEL_NAME}) in ${requestedLanguage}...`);
      const result = await model.generateContent({ contents: [{ role: "user", parts }], generationConfig, safetySettings });
      
      console.log('Received response from Gemini.');
      const response = result.response;
      const analysisText = response.text();
      
      // Clean up the temporary file asynchronously
      fs.unlink(tempFilePath, (unlinkErr) => {
          if (unlinkErr) console.error(`Error deleting temp analysis file: ${tempFilePath}`, unlinkErr);
          else console.log(`Deleted temp analysis file: ${tempFilePath}`);
      });

      res.json({ analysis: analysisText });

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      // Clean up the temporary file even if AI call fails
      fs.unlink(tempFilePath, (unlinkErr) => {
          if (unlinkErr) console.error(`Error deleting temp analysis file after AI error: ${tempFilePath}`, unlinkErr);
      });
      // Pass error to the next error handling middleware or send response
      // Check if headers have been sent before sending response
      if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to analyze plant image.', details: error.message });
      } else {
          // If headers already sent, pass error to default handler
          next(error); 
      }
    }
  });
});

module.exports = router; 