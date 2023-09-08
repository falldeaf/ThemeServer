//dotenv
require('dotenv').config();
const fetch = require('node-fetch');

// require the OpenAI API wrapper library
const { OpenAI } = require('openai');

const data = require('./preferences.json');

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});


const getRandomElement = (arr) => {
	const random_index = Math.floor(Math.random() * arr.length);
	return arr[random_index];
};

const toSingular = (word) => {
	return word.endsWith('s') ? word.slice(0, -1) : word;
};

const getRandomFromEachCategory = (data_object) => {
	const random_elements = {};

	for (const category in data_object) {
	if (Array.isArray(data_object[category])) {
		const singular_category = toSingular(category);
		random_elements[singular_category] = getRandomElement(data_object[category]);
	}
	}

	return random_elements;
};

async function generatePrompts() {

	const random_data = getRandomFromEachCategory(data);

	const prompt_role =
		`You will describe three variants of an Image for a Generative AI program to draw.
		One for a mobile theme, one for a browser theme, and one for a desktop theme.
		Please output JSON, like: {"mobile": "description here", "browser": "description here", "desktop": "description here"}
		Don't use the names mobile, browser, or desktop in your description.
		Your image should fit always fit a dark theme but be sure to emphasize the accent color.
		You should use an example artist to reinforce the art style given. Your description should be short but you'll do your
		best to create a gorgeous, intriguing image that's surprising and fun to look at.`;
	const prompt = `The subject of the image should be ${random_data.subject["name"]} with an accent color of ${random_data.color["name"]} in the style of ${random_data.style["name"]}.`;


	console.log(random_data);
	console.log(prompt_role);
	console.log(prompt);

	const response = await openai.chat.completions.create({
		//model: "gpt-3.5-turbo",
		model: "gpt-4",
		messages: [
		{
			"role": "system",
			"content": prompt_role
		},
		{
			"role": "user",
			"content": prompt
		}
		],
		temperature: 1,
		max_tokens: 800,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0,
	});

	//add JSON.parse(response.choices[0].message.content) to random_data
	const descriptions = JSON.parse(response.choices[0].message.content);

	random_data["mobile"] = {};
	random_data["mobile"]["description"] = descriptions["mobile"];

	random_data["browser"] = {};
	random_data["browser"]["description"] = descriptions["browser"];

	random_data["desktop"] = {};
	random_data["desktop"]["description"] = descriptions["desktop"];

	return random_data;
};

module.exports = generatePrompts;