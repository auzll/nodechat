var HOST = chatLib.HOST;
var EVENT_TYPE = chatLib.EVENT_TYPE;
var PORT = chatLib.PORT;

$(document).ready(function() {
	var socket = null;
	var onlineUserMap = new zTool.SimpleMap();
	var currentUser = null;
	var currentUserNick = null;
	var uid = 1;
	var connCounter = 1;
	var flag = 0;

	if(typeof WebSocket === 'undefined') {
		$("#prePage").hide();
		$("#errorPage").show();
	}

	function updateOnlineUser() {
		var html = ["<div>在线用户(" + onlineUserMap.size() + ")</div>"];
		if(onlineUserMap.size() > 0) {
			var users = onlineUserMap.values();
			for(var i in users) {
				html.push("<div>");
				if(users[i].uid == currentUser.uid) {
					html.push("<b>" + formatUserString(users[i]) + "(我)</b>");
				} else {
					html.push(formatUserString(users[i]));
				}
				html.push("</div>");
			}
		}

		$("#onlineUsers").html(html.join(''));
	}

	function appendMessage(msg) {
		$("#talkFrame").append("<div>" + msg + "</div>");
	}

	function formatUserString(user) {
		if(!user) {
			return '';
		}
		return user.nick + "<span class='gray'>(" + user.uid + ")</span> ";
	}

	function formatUserTalkString(user) {
		return formatUserString(user) + new Date().format("hh:mm:ss") + " ";
	}

	function formatUserTalkHisString(user, time) {
		return formatUserString(user) + new Date(time).format("yyyy-MM-dd hh:mm:ss") + " ";
	}

	function reset() {
		if(socket) {
			socket.close();
		}
		socket = null;
		onlineUserMap = null;
		$("#onlineUsers").html("");
		$("#talkFrame").html("");
		$("#nickInput").val("");
	}

	function close() {

	}

	$("#open").click(function(event) {
		currentUserNick = $.trim($("#nickInput").val());
		if('' == currentUserNick) {
			alert('请先输入昵称');
			return;
		}
		$("#prePage").hide();
		$("#mainPage").show();
		reset();

		socket = new WebSocket("ws://" + HOST + ":" + PORT);
		onlineUserMap = new zTool.SimpleMap();
		socket.onmessage = function(event) {
			var mData = chatLib.analyzeMessageData(event.data);

			if(mData && mData.event) {
				switch(mData.event) {
				case EVENT_TYPE.LOGIN:
					// 新用户连接
					var newUser = mData.values[0];
					if(flag == 0) {
						currentUser = newUser;
						flag = 1;
					}
					connCounter = mData.counter;
					uid = connCounter;
					onlineUserMap.put(uid, newUser);
					updateOnlineUser();
					appendMessage(formatUserTalkString(newUser) + "[进入房间]");
					break;

				case EVENT_TYPE.LOGOUT:
					// 用户退出
					var user = mData.values[0];
					alert(user.uid);
					onlineUserMap.remove(user.uid);
					updateOnlineUser();
					appendMessage(formatUserTalkString(user) + "[离开房间]");
					break;

				case EVENT_TYPE.SPEAK:
					// 用户发言
					var content = mData.values[0];
					if(mData.user.uid != currentUser.uid) {
						appendMessage(formatUserTalkString(mData.user));
						appendMessage("<span>&nbsp;&nbsp;</span>" + content);
					}
					break;

				case EVENT_TYPE.LIST_USER:
					// 获取当前在线用户
					var users = mData.values;
					if(users && users.length) {
						for(var i in users) {
							// alert(i + ' user : ' + users[i].uid);
							// alert('uid: ' + currentUser.uid);
							if(users[i].uid != currentUser.uid) onlineUserMap.put(users[i].uid, users[i]);
						}
					}
					//alert('currentUser:' + currentUser);
					updateOnlineUser();
					break;

				case EVENT_TYPE.LIST_HISTORY:
					// 获取历史消息
					//{'user':data.user,'content':content,'time':new Date().getTime()}
					var data = mData.values;
					if(data && data.length) {
						for(var i in data) {
							appendMessage(formatUserTalkHisString(data[i].user, data[i].time));
							appendMessage("<span>&nbsp;&nbsp;</span>" + data[i].content);
						}
						appendMessage("<span class='gray'>==================以上为最近的历史消息==================</span>");
					}
					break;

				case EVENT_TYPE.ERROR:
					// 出错了
					appendMessage("[系统繁忙...]");
					break;

				default:
					break;
				}

			}
		};

		socket.onerror = function(event) {
			appendMessage("[网络出错啦，请稍后重试...]");
		};

		socket.onclose = function(event) {
			appendMessage("[网络连接已被关闭...]");
			close();
		};

		socket.onopen = function(event) {
			socket.send(JSON.stringify({
				'EVENT': EVENT_TYPE.LOGIN,
				'values': [currentUserNick]
			}));
			socket.send(JSON.stringify({
				'EVENT': EVENT_TYPE.LIST_USER,
				'values': [currentUserNick]
			}));
			socket.send(JSON.stringify({
				'EVENT': EVENT_TYPE.LIST_HISTORY,
				'values': [currentUserNick]
			}));
		};
	});

	$("#message").keyup(function(event) {
		if(13 == event.keyCode) {
			sendMsg();
		}
	});

	function sendMsg() {
		var value = $.trim($("#message").val());
		if(value) {
			$("#message").val('');
			appendMessage(formatUserTalkString(currentUser));
			appendMessage("<span>&nbsp;&nbsp;</span>" + value);
			socket.send(JSON.stringify({
				'EVENT': EVENT_TYPE.SPEAK,
				'values': [currentUser.uid, value]
			}));
		}
	};

	$("#send").click(function(event) {
		sendMsg();
	});
	$("#createroom").click(function(event)) {

	}

	function show(value) {
		$("#response").html(value);
	};
});