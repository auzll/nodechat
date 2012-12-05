(function(exports) {
	// 事件类型
	exports.EVENT_TYPE = {
		'LOGIN': 'LOGIN',
		'LOGOUT': 'LOGOUT',
		'SPEAK': 'SPEAK',
		'LIST_USER': 'LIST_USER',
		'ERROR': 'ERROR',
		'LIST_HISTORY': 'LIST_HISTORY'
	};

	// 服务端口
	exports.PORT = 9800;

	// 服务端口
	exports.HOST = "localhost";

	var analyzeMessageData = exports.analyzeMessageData = function(message) {
			try {
				return JSON.parse(message);
			} catch(error) {
				// 收到了非正常格式的数据
				console.log('method:analyzeMsgData,error:' + error);
			}

			return null;
		}

	var getMsgFirstDataValue = exports.getMsgFirstDataValue = function(mData) {
			if(mData && mData.values && mData.values[0]) {
				return mData.values[0];
			}

			return '';
		}

	var getMsgFirstDataValue = exports.getMsgSecondDataValue = function(mData) {
			if(mData && mData.values && mData.values[1]) {
				return mData.values[1];
			}

			return '';
		}

})((function() {
	if(typeof exports === 'undefined') {
		window.chatLib = {};
		return window.chatLib;
	} else {
		return exports;
	}
})());