require('dotenv').config();
const fetch = require('node-fetch');

//hash of models
const settings = {
	"desktop": {
		"model": "b820ea11-02bf-4652-97ae-9ac0cc00593d", //leonardo diffusion
		"width": 1024,
		"height": 576,
		"upscale": true
	},
	"browser": {
		"model": "b820ea11-02bf-4652-97ae-9ac0cc00593d", //leonardo diffusion
		"width": 1024,
		"height": 1024,
		"upscale": false
	},
	"mobile": {
		"model": "ac614f96-1082-45bf-be9d-757f2d31c174", //DreamShaper v7
		"width": 640,
		"height": 832,
		"upscale": false
	}
};

async function generateAndFetchArt(description, settings_object) {
	const apiUrl = 'https://cloud.leonardo.ai/api/rest/v1/generations';
	const authorizationToken = 'Bearer ' + process.env.LEONARDO_API_KEY; // Replace this with your actual token

	const payload = {
		width:   settings_object.width,
		height:  settings_object.height,
		modelId: settings_object.model,
		prompt: description,
		alchemy: false,
		contrastRatio: 0.5,
		highResolution: true,
		highContrast: true,
		promptMagic: true,
		//promptMagicVersion: "V3",
		presetStyle: "LEONARDO",
		num_images: 1
	};

	const postOptions = {
		method: 'POST',
		headers: {
		'Accept': 'application/json',
		'Authorization': authorizationToken,
		'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	};

	try {
		let response = await fetch(apiUrl, postOptions);
		let jsonResponse = await response.json();
		const generationId = jsonResponse.sdGenerationJob.generationId;

		let maxAttempts = 10;

		const getOptions = {
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Authorization': authorizationToken
		}
		};

		while (maxAttempts > 0) {
		response = await fetch(`${apiUrl}/${generationId}`, getOptions);
		jsonResponse = await response.json();

		if (jsonResponse.generations_by_pk.status === 'COMPLETE') {
			return jsonResponse.generations_by_pk.generated_images[0].url;
		}

		maxAttempts--;
		await new Promise(resolve => setTimeout(resolve, 4000));
		}

		throw new Error('Max attempts reached. Generation is not complete.');

	} catch (error) {
		console.error(`Error occurred: ${error}`);
		return null;
	}
}

// Usage
(async () => {
	try {
		const artUrl = await generateAndFetchArt('In the style of Yves Tanguy, an alien seascape filled with odd, chartreuse-colored ramen formations with noodles spilling over bizarrely-shaped cliffs, under a smoky purple sky with a black background.', settings['desktop']);
		console.log(`Art URL: ${artUrl}`);
	} catch (error) {
		console.error(`An error occurred: ${error}`);
	}
})();