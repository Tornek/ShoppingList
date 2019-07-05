var _ = require('lodash');
var _lists = {};

module.exports = {
	createIfNotExist: (chatId) => {
		if(!_lists[+chatId]){
			_lists[+chatId] = {
				location: {
					route: 'menu',
					data: null
				},
				lists: {}
			}
		}
	},
	setLocation: (chatId, location) => {
		if(_lists[+chatId]){
			_lists[+chatId].location = {
				..._lists[+chatId].location,
				...location
			}
		}
	},
	getLocation: (chatId) => {
		return _lists[+chatId].location;
	},
	getLists: (chatId) => {
		return _.transform(_lists[+chatId].lists, function(result, value, key){
			return result[key] =  value.title;
		}, {});
	},
	removeFromLists: (chatId, listId) => {
		delete _lists[+chatId].lists[+listId];
		
		return true;
	},
	
	getListById: (chatId, listId) => {
		return _lists[+chatId].lists[+listId];
	},
	removeItemFromList: (chatId, listId, itemId) => {
		delete _lists[+chatId].lists[+listId].items[+itemId];
		
		return true;
	},
	toggleItemFromList: (chatId, listId, itemId) => {
		var items = _lists[+chatId].lists[+listId].items[+itemId];
		
		items.checked = !items.checked;
		
		return true;
	},
	
	createList: (chatId, title) => {
		var newId = +(_.max(Object.keys(_lists[+chatId].lists)) || -1) + 1;
		
		_lists[+chatId].lists[newId] = {
			title: title,
			items: {}
		};
		return newId;
	},
	setItem: (chatId, listId, title) => {
		var newId = +(_.max(Object.keys(_lists[+chatId].lists[+listId].items)) || -1) + 1;
		
		_lists[+chatId].lists[+listId].items[newId] = {
			title: title,
			checked: false
		};
		return Object.keys(_lists[+chatId].lists[+listId].items).length; 
	}
};