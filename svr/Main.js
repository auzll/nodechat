var sys = require("sys");
var ws = require('../lib/ws/server');
var server = ws.createServer({'debug':true});

var zTool = require("./zTool");
var onlineUserMap = new zTool.SimpleMap();
var historyContent = new zTool.CircleList(100);

var chatLib = require("./chatLib");
var EVENT_TYPE = chatLib.EVENT_TYPE;
var PORT = chatLib.PORT;

server.addListener("connection", function(conn){

	conn.addListener("message", function(message){
		var mData = chatLib.analyzeMessageData(message);

		if (mData && mData.EVENT) {
			switch (mData.EVENT) {	
			case EVENT_TYPE.LOGIN: // 新用户连接
				var newUser = {'uid':conn.id, 'nick':chatLib.getMsgFirstDataValue(mData)};

				// 把新连接的用户增加到在线用户列表
				onlineUserMap.put(conn.id, newUser);

				// 把新用户的信息广播给在线用户
				conn.broadcast(JSON.stringify({'user':onlineUserMap.get(conn.id), 'event':EVENT_TYPE.LOGIN, 'values':[newUser]}));
				break;

			case EVENT_TYPE.SPEAK: // 用户发言
				var content = chatLib.getMsgFirstDataValue(mData);
				conn.broadcast(JSON.stringify({'user':onlineUserMap.get(conn.id), 'event':EVENT_TYPE.SPEAK, 'values':[content]}));
				historyContent.add({'user':onlineUserMap.get(conn.id),'content':content,'time':new Date().getTime()});
				break;

			case EVENT_TYPE.LIST_USER: // 获取当前在线用户
				conn.send(JSON.stringify({'user':onlineUserMap.get(conn.id), 'event':EVENT_TYPE.LIST_USER, 'values':onlineUserMap.values()}));
				break;

			case EVENT_TYPE.LIST_HISTORY: // 获取最近的聊天记录
				conn.send(JSON.stringify({'user':onlineUserMap.get(conn.id), 'event':EVENT_TYPE.LIST_HISTORY, 'values':historyContent.values()}));
				break;

			default:
				break;
			}
		
		} else {
			// 事件类型出错，记录日志，向当前用户发送错误信息
			console.log('desc:message,userId:' + conn.id + ',message:' + message);
			conn.send(JSON.stringify({'uid':conn.id, 'event':EVENT_TYPE.ERROR}));
		}
	});

});
 
server.addListener("error", function(){
	console.log(Array.prototype.join.call(arguments, ", "));
});

server.addListener("disconnect", function(conn){
	// 从在线用户列表移除
	var logoutUser = onlineUserMap.remove(conn.id);

	if (logoutUser) {
		// 把已退出用户的信息广播给在线用户
		conn.broadcast(JSON.stringify({'uid':conn.id, 'event':EVENT_TYPE.LOGOUT, 'values':[logoutUser]}));
	}
});

server.listen(PORT);

console.log('Start listening on port ' + PORT);