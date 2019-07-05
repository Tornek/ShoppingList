var _ = require('lodash');
var ENTITIES = {
		MENU: 'menu',
		CREATE: 'create',
		LISTS: 'lists',
		LIST: 'list'
	},
	MESSAGE_TYPE = {
		COMMAND: 'command',
		TEXT: 'text',
		BTN_CALLBACK: 'btn_callback'
	};

var routers = {},
	BOT = null,
	User = require('./user');

routers[ENTITIES.MENU] = {
	title: 'MENU:',
	show: function(chatId){
		var list = User.getLists(chatId),
			buttons = [{text: 'Create new list', callback_data: `${ENTITIES.CREATE}.show`}];
		
		if(Object.keys(list).length){
			buttons.push({text: 'Your lists', callback_data: `${ENTITIES.LISTS}.show`});
		}
		BOT.sendMessage(chatId, this.title, {
			reply_markup: JSON.stringify({
				inline_keyboard: [buttons]
			})
		});
	}
};

routers[ENTITIES.CREATE] = {
	title: `Create list:`,
	show: (chatId, data) => {
		User.setLocation(chatId, {
			route: ENTITIES.CREATE,
			data: data
		});
		
		BOT.sendMessage(chatId, `What's the title of the list?`);
	},
	setTitle: (chatId, data) => {
		var listId = User.createList(chatId, data.argument);
		
		User.setLocation(chatId, {
			route: ENTITIES.CREATE,
			data: {
				...data,
				listId: listId
			}
		});
		BOT.sendMessage(chatId, 
			`Just created a list of «${data.argument}». \r\nWhat do you want to buy?`
		);
	},
	setItems: (chatId, data) => {
		var location = User.getLocation(chatId),
			items = data.argument.split('\n'),
			itemsCount = 0;
		
		items.forEach(item => {
			itemsCount = User.setItem(chatId, location.data.listId, item);
		});
		
		BOT.sendMessage(chatId,
			`Ok. \r\n You have ${itemsCount} item${itemsCount > 1 ? 's' : ''} in the list.`
		);
	}
};
routers[ENTITIES.LISTS] = {
	title: `Your lists:`,
	remove: function(chatId, data){
		if(data.argument){
			User.removeFromLists(chatId, data.argument);
			this.show(chatId, data);
		}
	},
	show: function(chatId, data){
		var list = User.getLists(chatId),
			buttons = [],
			text = this.title;
		
		Object.keys(list).forEach(id => {
			buttons.push([
				{text: list[id], callback_data: `${ENTITIES.LIST}.show.${id}`},
				{text: '❌', callback_data: `${ENTITIES.LISTS}.remove.${id}`}
			]);
		});
		if(buttons.length === 0){
			text = 'Your lists are empty';
			buttons = [
				[
					{text: 'Back to menu', callback_data: `${ENTITIES.MENU}.show`},
					{text: 'Create new list', callback_data: `${ENTITIES.CREATE}.show`}
				]
			]
		}
		if(data.messageId){
			BOT.editMessageText(text, {
				chat_id: chatId,
				message_id: data.messageId,
				reply_markup: JSON.stringify({
					inline_keyboard: buttons
				})
			});
		}else{
			BOT.sendMessage(chatId, text, {
				reply_markup: JSON.stringify({
					inline_keyboard: buttons
				})
			});
		}
	}
};
routers[ENTITIES.LIST] = {
	title: `Shopping List: `,
	show: function(chatId, data){
		if(data.argument){
			var list = User.getListById(chatId, data.argument),
				buttons = [],
				text = this.title + list.title;
			
			User.setLocation(chatId, {
				route: ENTITIES.LISTS,
				data: data
			});
			_.chain(list.items)
				.toPairsIn()
				.sortBy(['[1].checked'])
				.value()
				.forEach(function(item){
					buttons.push([
						{text: (item[1].checked ? '✅ ' : '') + item[1].title, callback_data: `${ENTITIES.LIST}.toggle.${item[0]}`},
						{text: '❌', callback_data: `${ENTITIES.LIST}.remove.${item[0]}`}
					]);
				});
			
			if(data.messageId){
				BOT.editMessageText(text, {
					chat_id: chatId,
					message_id: data.messageId,
					reply_markup: JSON.stringify({
						inline_keyboard: buttons
					})
				});
			}else{
				BOT.sendMessage(chatId, text, {
					reply_markup: JSON.stringify({
						inline_keyboard: buttons
					})
				});
			}
		}
	},
	remove: function(chatId, data){
		var userLocation = User.getLocation(chatId);
		
		//Берем id элемента из data, и id списка из записи локации пользователя
		if(
			data.argument &&
			userLocation.data.argument
		){
			User.removeItemFromList(chatId, userLocation.data.argument, data.argument);
			this.show(chatId, userLocation.data);
		}
	},
	toggle: function(chatId, data){
		var userLocation = User.getLocation(chatId);
		
		if(
			data.argument &&
			userLocation.data.argument
		){
			User.toggleItemFromList(chatId, userLocation.data.argument, data.argument);
			this.show(chatId, userLocation.data);
		}
	}
};


module.exports = {
	MESSAGE_TYPE,
	ENTITIES,
	setBot: (NEW_BOT) => {
		BOT = NEW_BOT;
	},
	resolve: (msgType, chatId, data) => {
		User.createIfNotExist(chatId);
		if(msgType === MESSAGE_TYPE.TEXT){
			var location = User.getLocation(chatId);
			
			data.entity = location.data.entity;
			data.action = 'show'; 
			if(data.entity === ENTITIES.CREATE){
				//Если предыдущий шаг был «показать раздел»
				if(location.data.action === 'show'){
					data.action = 'setTitle';
				}else{
					data.action = 'setItems';
				}
			}
		}
		
		try{
			routers[data.entity][data.action](chatId, data);
		}catch(e){
			BOT.sendMessage(chatId, 'Something went wrong :(');
		}
	}
};