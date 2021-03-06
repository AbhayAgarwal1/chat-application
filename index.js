var express = require('express'),
 	app = express(),
 	server = require('http').createServer(app),
 	io = require('socket.io').listen(server);
 	users = {};
 	mongoose = require('mongoose');




server.listen(3000);

mongoose.connect('mongodb://localhost/chat-application', function(err){
	if(err){
		console.log(err);
	} else{
		console.log('connect to mongodb');
	}
	});

var chatSchema = mongoose.Schema({
	nick:String,
	msg:String,
	created:{type:Date,default:Date.now}
});

var Chat = mongoose.model('Message',chatSchema);


app.get('/',function(req, res){
	res.sendfile(__dirname + '/index.html');
		
}); 	



io.sockets.on('connection',function(socket){
	Chat.find({}, function(err, docs){
		if(err) throw err;
		console.log('sending old msgs');
		socket.emit('load old msgs',docs);
	});
	socket.on('new user', function(data, callback){
		if (data in users){
			callback(false);
		}else{
			socket.nickname = data;
			callback(true);
			users[socket.nickname] = socket;
			updateNicknames();

		}
	});

	function updateNicknames(){
		io.sockets.emit('usernames',Object.keys(users));

	}

	socket.on('send message', function(data){
		
		var msg = data.trim();
		if(msg.substr(0,3) === '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !==-1){
				var name = msg.substring(0,ind);
				var msg = msg.substring(ind+1);
				if (name in users){
					users[name].emit('whisper',{msg:msg,nick:socket.nickname});
					console.log('whisper!');

				} else{console.log("please enter valid user")
					callback('error: enter a valid user');

				}}
			else{
				callback('Error : PLease enter a message for yoour whisper');

			}}
			
		else{
			var newMsg = new Chat({msg:msg, nick:socket.nickname});
			newMsg.save(function(err){

				if(err) throw err;
		io.sockets.emit('new message', {msg:data,nick:socket.nickname});
		});
		}

	});

	socket.on('disconnect',function(data){
				if(!socket.nickname) return;
				delete users[socket.nickname];
				
				updateNicknames();
				

			});
});


