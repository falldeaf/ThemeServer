const getimage = require('./leonardo2.js');
const getprompts = require('./gptdescriber.js');
const microcommander = require('microcommander');

const mc = new microcommander('config.json', 'theme-server', 5600, false);

let current_images = {};

mc.defineLog('mylog', 50, 'Logs');

mc.defineJson('currentimages', () =>{ return current_images; }, 'JSON');

mc.defineSwitch('pause', false, 'Switches');

mc.defineCron('getimages', async () => {
	if(mc.isSwitchOn('mycronswitch')) return;

	try {
		let new_image_gen = await getprompts();
		new_image_gen['uid'] = Math.floor(Math.random() * 9000) + 1000;
		new_image_gen['desktop']['url'] = await getimage(new_image_gen['desktop']['description'], 'desktop');
		new_image_gen['mobile']['url'] = await getimage(new_image_gen['mobile']['description'], 'mobile');
		new_image_gen['browser']['url'] = await getimage(new_image_gen['browser']['description'], 'browser');
		console.log(new_image_gen);
		current_images = new_image_gen;
		mc.appendLog('mylog', `New images generated: ${new_image_gen['uid']}`);
	} catch (error) {
		mc.appendLog('mylog', `Error occurred: ${error}`);
	}

}, 'Cron Tasks');

mc.listen();

//anonymous async function
/*
(async () => {
	let new_image_gen = await getprompts();

	//set current_images['uid] to a random 4 digit number
	new_image_gen['uid'] = Math.floor(Math.random() * 9000) + 1000;

	//console.log(new_image_gen);

	new_image_gen['desktop']['url'] = await getimage(new_image_gen['desktop']['description'], 'desktop');
	new_image_gen['mobile']['url'] = await getimage(new_image_gen['mobile']['description'], 'mobile');
	new_image_gen['browser']['url'] = await getimage(new_image_gen['browser']['description'], 'browser');

	console.log(new_image_gen);

	//console.log(await getimage('A beautiful image of a cat in the style of Van Gogh.', 'browser'));
})();
*/