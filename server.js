const TelegramBot = require('node-telegram-bot-api'),
	router = require('./routers'),
	// Create a bot that uses 'polling' to fetch new updates
	BOT = new TelegramBot(process.env.TOKEN, {polling: true});

router.setBot(BOT);

// Matches "/start" command
BOT.onText(/\/start/, (msg) => {
	router.resolve(router.MESSAGE_TYPE.COMMAND, msg.chat.id, {
		entity: router.ENTITIES.MENU,
		action: 'show'
	});
});
// Callback for buttons
BOT.on('callback_query', (msg) => {
	var data = msg.data.split('.');
	
	router.resolve(router.MESSAGE_TYPE.BTN_CALLBACK, msg.message.chat.id, {
		entity: data[0],
		action: data[1],
		argument: data[2],
		messageId :msg.message.message_id
	});
});
BOT.on('message', (msg) => {
	if(!/\/start/.exec(msg.text)){
		router.resolve(router.MESSAGE_TYPE.TEXT, msg.chat.id,{
			argument: msg.text
		});
	}
});