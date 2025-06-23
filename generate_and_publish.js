#!/usr/bin/env node
import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = 'https://gen-image-main.vercel.app';
const FILE2LINK_URL = 'https://file2link-3pse.onrender.com/upload';
const USERS = [
  {
    email: 'scoder120@gmail.com',
    password: '1234567',
    prompts: [
      'A futuristic city at sunset',
      'A robot painting a portrait',
      'A neon-lit street at night',
      'A magical forest with glowing mushrooms',
      'A fantasy castle in the clouds',
      'A dragon flying over a volcano',
      'A cyberpunk warrior with neon armor',
      'A peaceful mountain landscape',
      'A super car with aeroplane wings',
      'An underwater palace with coral and sea creatures',
      'A bustling market in Marrakesh',
      'A serene Japanese garden at dawn'
    ]
  },
  {
    email: 'genz@genz.com',
    password: '11111111',
    prompts: [
      'A futuristic train speeding through a neon city',
      'A steampunk airship above the clouds',
      'A mystical portal in an ancient forest',
      'A retro diner on Mars',
      'A giant robot defending a city',
      'A crystal cave with glowing minerals',
      'A medieval knight in shining armor',
      'A cybernetic animal in a digital jungle',
      'A lost temple in the Amazon',
      'A pirate ship in a stormy sea'
    ]
  },
  {
    email: 'alph@gmail.com',
    password: '7777777777',
    prompts: [
      'A snow leopard on a mountain peak',
      'A futuristic underwater research lab',
      'A bustling street in Tokyo at night',
      'A fantasy dragon soaring above clouds',
      'A magical library with floating books',
      'A superhero landing on a rooftop',
      'A glowing crystal in a dark cave',
      'A time traveler in Victorian London',
      'A spaceship landing on an alien planet',
      'A haunted house on a hill',
      'A peaceful lakeside cabin in autumn'
    ]
  },
  {
    email: 'user4@example.com',
    password: 'password4',
    prompts: [
      'A neon-lit cyberpunk alley',
      'A futuristic motorcycle race',
      'A magical deer in a misty forest',
      'A city skyline at sunrise',
      'A robot chef cooking in a kitchen',
      'A fantasy castle on a floating island',
      'A glowing jellyfish in the deep sea',
      'A samurai in a bamboo forest',
      'A retro-futuristic car on a desert road',
      'A wizard casting a spell',
      'A bustling bazaar in Istanbul',
      'A peaceful zen garden'
    ]
  },
  {
    email: 'user5@example.com',
    password: 'password5',
    prompts: [
      'A dragon curled around a mountain',
      'A futuristic city with flying cars',
      'A magical fox in a snowy forest',
      'A pirate treasure cave',
      'A superhero team in action',
      'A glowing portal in a stone archway',
      'A steampunk robot butler',
      'A fantasy airship battle',
      'A neon sign in a rainy city',
      'A peaceful village at dusk'
    ]
  }
];
const ASPECTS = ['16:9', '9:16', '1:1'];

function getRandomAspect() {
  return ASPECTS[Math.floor(Math.random() * ASPECTS.length)];
}

async function uploadToFile2Link(imageUrl) {
  // Download image as buffer
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(response.data);
  // Prepare form data
  const formData = new FormData();
  formData.append('image', imageBuffer, 'image.jpg');
  // Upload to File2Link
  try {
    const uploadRes = await axios.post(FILE2LINK_URL, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return uploadRes.data.url;
  } catch (e) {
    if (e.response) {
      console.error('File2Link upload failed:', e.response.status, e.response.data);
    } else {
      console.error('File2Link upload failed:', e.message);
    }
    throw e;
  }
}

async function runForUser(user) {
  let token;
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/login`, { email: user.email, password: user.password });
    token = loginRes.data.token;
    console.log(`Logged in as ${user.email}`);
  } catch (e) {
    console.error(`Login failed for ${user.email}:`, e.response?.data || e.message);
    return;
  }

  for (const prompt of user.prompts) {
    const aspect = getRandomAspect();
    try {
      // Generate image using Flux model
      const genRes = await axios.get(`${BASE_URL}/api/generate/flux`, {
        params: { prompt, aspect },
        headers: { Authorization: `Bearer ${token}` }
      });
      let imageUrl = genRes.data.imageUrl;
      if (imageUrl && typeof imageUrl === 'object' && imageUrl.url) imageUrl = imageUrl.url;
      if (!genRes.data.success || !imageUrl || typeof imageUrl !== 'string') {
        throw new Error(genRes.data.error || 'No valid imageUrl in response');
      }
      console.log(`Generated image for prompt "${prompt}" [${aspect}]: ${imageUrl}`);

      // Upload to File2Link (multipart/form-data)
      let uploadedUrl;
      try {
        uploadedUrl = await uploadToFile2Link(imageUrl);
        console.log('Uploaded to File2Link:', uploadedUrl);
      } catch (e) {
        continue;
      }

      // Add to community gallery
      const uploadRes = await axios.post(`${BASE_URL}/api/add-community-image`, {
        originalUrl: imageUrl,
        uploadedUrl,
        prompt
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (uploadRes.data.success) {
        console.log('Published to community:', uploadRes.data.image.id);
      } else {
        console.error('Failed to publish:', uploadRes.data.error);
      }
    } catch (e) {
      console.error(`Error for prompt "${prompt}" [${aspect}] (user: ${user.email}):`, e.response?.data || e.message);
    }
  }
}

async function main() {
  for (const user of USERS) {
    await runForUser(user);
  }
}

main(); 
