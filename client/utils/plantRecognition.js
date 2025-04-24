import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// List of plant-related classes in MobileNet
const plantClasses = [
  'pot', 'vase', 'flower', 'plant', 'tree', 'garden', 'leaf', 'greenhouse',
  'bonsai', 'houseplant', 'herb', 'succulent', 'forest', 'jungle', 
  'vegetation', 'flowerpot'
];

// Initialize model lazily
let model = null;

/**
 * Load the model if not already loaded
 * @returns {Promise<mobilenet.MobileNet>} The loaded model
 */
const loadModel = async () => {
  if (!model) {
    console.log('Loading MobileNet model...');
    model = await mobilenet.load();
    console.log('MobileNet model loaded');
  }
  return model;
};

/**
 * Check if an image contains a plant
 * @param {File|Blob|string} imageSource - Image file, blob, or data URL to classify
 * @param {number} confidenceThreshold - Minimum confidence to consider a match (0-1)
 * @returns {Promise<{isPlant: boolean, confidence: number, className: string}>} Result object
 */
export const isPlantImage = async (imageSource, confidenceThreshold = 0.4) => {
  try {
    // Create an HTMLImageElement from the source
    const img = await createImageElement(imageSource);
    
    // Load the model
    const mobileNetModel = await loadModel();
    
    // Run inference
    const predictions = await mobileNetModel.classify(img);
    console.log('Image classification results:', predictions);
    
    // Check if any prediction matches plant-related classes
    for (const prediction of predictions) {
      const className = prediction.className.toLowerCase();
      
      // Check if the class name contains any plant-related terms
      const matchesPlant = plantClasses.some(plantClass => 
        className.includes(plantClass)
      );
      
      console.log(`  [Plant Recognition] Class: ${prediction.className}, Probability: ${prediction.probability}, Matches Plant List: ${matchesPlant}`);

      if (matchesPlant && prediction.probability > confidenceThreshold) {
        console.log(`    [Plant Recognition] Match found! Returning isPlant: true`);
        return {
          isPlant: true,
          confidence: prediction.probability,
          className: prediction.className
        };
      }
    }
    
    return { 
      isPlant: false, 
      confidence: 0,
      className: predictions[0]?.className || 'unknown'
    };
  } catch (error) {
    console.error('Error checking plant image:', error);
    // In case of error, allow the image (don't block user experience)
    return { isPlant: true, confidence: 0, className: 'error' };
  }
};

/**
 * Create an HTMLImageElement from different image sources
 * @param {File|Blob|string} source - Image source (File, Blob, or data URL)
 * @returns {Promise<HTMLImageElement>} Image element ready for processing
 */
const createImageElement = async (source) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Error loading image'));
    
    if (typeof source === 'string') {
      // If source is already a data URL
      img.src = source;
    } else {
      // If source is a File or Blob
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (e) => reject(new Error('Error reading file'));
      reader.readAsDataURL(source);
    }
  });
};

export default { isPlantImage }; 