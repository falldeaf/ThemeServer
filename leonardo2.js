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

async function checkGenerationComplete(generationId, authorizationToken, maxAttempts = 10) {
	const getOptions = {
	method: 'GET',
	headers: {
		'Accept': 'application/json',
		'Authorization': authorizationToken
	}
	};

	while (maxAttempts > 0) {
		try {
			const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, getOptions);
			const jsonResponse = await response.json();

			if (jsonResponse.generations_by_pk.status === 'COMPLETE') {
				return jsonResponse;
			}
		} catch (error) {
			console.error(`Error occurred: ${error}`);
		}


		maxAttempts--;
		await new Promise(resolve => setTimeout(resolve, 4000));
	}

	throw new Error('Max attempts reached. Generation is not complete.');
}

async function checkUpscaleComplete(upscaleId, authorizationToken, maxAttempts = 10) {
	const getOptions = {
	method: 'GET',
	headers: {
		'Accept': 'application/json',
		'Authorization': authorizationToken
	}
	};

	while (maxAttempts > 0) {
	const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/variations/${upscaleId}`, getOptions);
	const jsonResponse = await response.json();

	if (jsonResponse.generated_image_variation_generic[0].status === 'COMPLETE') {
		return jsonResponse;
	}

	maxAttempts--;
	await new Promise(resolve => setTimeout(resolve, 4000));
	}

	throw new Error('Max attempts reached. Upscaling is not complete.');
}

async function generateAndFetchArt(description, settings_string) {

	let settings_object = settings[settings_string];

	const apiUrl = 'https://cloud.leonardo.ai/api/rest/v1/generations';
	const authorizationToken = 'Bearer ' + process.env.LEONARDO_API_KEY; // Replace this with your actual token

	const payload = {
	width: settings_object.width,
	height: settings_object.height,
	modelId: settings_object.model,
	prompt: description,
	alchemy: false,
	contrastRatio: 0.5,
	highResolution: true,
	highContrast: true,
	promptMagic: true,
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

	jsonResponse = await checkGenerationComplete(generationId, authorizationToken);

	if (settings_object.upscale) {
		small_id = jsonResponse.generations_by_pk.generated_images[0].id;

		const upscalePayload = {
		id: small_id
		};

		const upscalePostOptions = {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Authorization': authorizationToken,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(upscalePayload)
		};

		response = await fetch('https://cloud.leonardo.ai/api/rest/v1/variations/upscale', upscalePostOptions);
		jsonResponse = await response.json();
		const upscaleId = jsonResponse.sdUpscaleJob.id;

		jsonResponse = await checkUpscaleComplete(upscaleId, authorizationToken);
		console.log(jsonResponse);
		return jsonResponse.generated_image_variation_generic[0].url;
	} else {
		return jsonResponse.generations_by_pk.generated_images[0].url;
	}
	} catch (error) {
	console.error(`Error occurred: ${error}`);
	return null;
	}
}

module.exports = generateAndFetchArt;

/*
// Usage
(async () => {
	try {
		const artUrl = await generateAndFetchArt('Capture a honey bee delicately perched on a geometric flower. Utilize indigo prominently in the backdrop with sporadic light spots, casting shadows on the bee. The simplicity and surreal aspects display influences of Salvador Dali\'s minimalist style.', settings['desktop']);
		console.log(`Art URL: ${artUrl}`);
	} catch (error) {
		console.error(`An error occurred: ${error}`);
	}
})();
*/