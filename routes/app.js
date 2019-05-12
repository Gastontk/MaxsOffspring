var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Pic = require('../models/pic');
var Ipinfo = require('../models/ipinfo');

//for image upload
var multer  = require('multer')
var upload = multer({ dest: 'public/pics/' })
var fs = require('fs');
//get ip of req
var getIP = require('ipware')().get_ip;

//geo locating based on ip
var iplocation = require('iplocation')

//twilio text (SMS)
var accountSid = 'AC1ac11efe45372db188c957bafc3059bf'; // Your Account SID from www.twilio.com/console
var authToken = 'b0ef2064b151dbad223b2e8b6f81a122';   // Your Auth Token from www.twilio.com/console

var twilio = require('twilio');
var client = new twilio(accountSid, authToken);





router.post('/upload', function (req, res) {
	
});

router.post('/delete', function(req, res){
	console.log('deleteing', req.body)
	// Pic.findById(req.body.data, function(err, response){
	// 	console.log(response);
	// })
	Pic.remove({ _id: req.body.data }, function(err) {
	});
	res.redirect('/');
	
})



router.get('/pics/:pic', function(req, res, next){
	console.log('getting individual pic')
	res.sendFile('/public/pics/'+req.params.pic );
})



//get DB list of users and pics
router.get('/pics', function(req, res, next){


//for IP logging
	var ipInfo = getIP(req);
	var ip = ipInfo.clientIp.slice(7)
	var reqLocation;
	iplocation(ip, function (error, res) {
 		// console.log(res)
 		reqLocation = res
 		console.log(reqLocation.toString())
	 	var ipdata = new Ipinfo({
			info: ip,
			location: reqLocation
		});
		ipdata.save(function(err){
			

		})
 		// console.log('reqLocation', reqLocation.toJson())

 
	})

//



	console.log(ipInfo)
	console.log('getting pics')
	Pic.find({})
	 .populate('parents', ['name','url','_id'])
	 .populate('children', ['name', 'url', '_id'])
	 .exec(function(err, docs){
		// console.log(docs)
		res.json({pics:docs})
	})
})


router.get('/profile', function(req, res, next){
	res.redirect('/');
})



//edit person
router.post('/profile/:id', upload.single('file'), function(req, res){
	console.log('In router Post for edit', req.params);

  	if(typeof req.file != 'undefined'){
		var finalUrl = '/pics/' +req.file.filename;
	  	var file = __dirname + '/public/pics/' + req.file.filename;


	  	fs.rename(req.file.path, 'public/pics/' +req.file.filename, function(err) {
		    if (err) {
		      console.log(err);
		      // res.send(500);
		    } else {


				Pic.findById(req.params.id, function(err, person){
					if(err){
						console.log('An error grabbing person', err)
					}else{
						console.log(person);
						person.notes = req.body.notes;
						person.name = req.body.name;
						person.url = finalUrl;
						person.save(function(err){
							if(err){console.log(err)}
							else{
								res.redirect('/');
							}
						})
					}
				})
			}
		})
  	}else{
  		console.log('file NOT found');
		Pic.findById(req.params.id, function(err, person){
			if(err){
				console.log('An error grabbing person', err)
			}else{
				console.log(person);
				person.notes = req.body.notes;
				person.name = req.body.name;
				person.save(function(err){
					if(err){console.log(err)}
					else{
						res.redirect('/');
					}
				})
			}
		})
  	}



	 

});


	








//Add a new person
router.post('/profile', upload.single('file'), function(req, res) {
	// console.log('filename',req.file.originalname.split('.').pop())
	console.log('body',req.body)





  var finalUrl = '/pics/' +req.file.filename 
  var file = __dirname + '/public/pics/' + req.file.filename;
  fs.rename(req.file.path, 'public/pics/' +req.file.filename, function(err) {
    if (err) {
      console.log(err);
      // res.send(500);
    } else {
//save reference to user and pic in DB
	var pic = new Pic({
		url: finalUrl,
		name: req.body.name,
		notes: req.body.notes,
		level: req.body.level

	})
	console.log('pic.level is', pic.level, req.body.level)
	pic.save(function(err){
		if(err){console.log(error)}
		else{
			res.redirect('/xxx');
		}
	})
    }
  });
});


//add child to existing pic(USER)
router.post('/addChild', upload.single('file'), function(req, res){


	//send text to inform of new offspring
	let message = 'new offspring ' + req.body.name; 
	client.messages.create({
		    body: message,
		    to: '+12068772788',  // Text this number
		    from: '+12068008396' // From a valid Twilio number
	})
	.then((message) => console.log(message.sid));

//handle saving of new Pic(user) with addition of parentId pushed into parents field.
	var postData = req.body
	console.log('/addChild')
	console.log('Body', postData)
	// res.redirect('/');
	var finalUrl = '/pics/' +req.file.filename 
	var file = __dirname + '/public/pics/' + req.file.filename;
	fs.rename(req.file.path, 'public/pics/' +req.file.filename, function(err) {
	    if (err) {
	      console.log(err);
	      res.send(500);
	    } else {









//get parent(and therefore parent level) and add level to pic before saveing.
		Pic.findById(postData.parentId, function(err, response){
			console.log('level is', response.level)
		 		

				//save reference to user and pic in DB
			var pic = new Pic({
				url: finalUrl,
				name: req.body.name,
				notes: req.body.notes,
				level: (response.level +1)
			})	

			pic.parents.push(postData.parentId);
			console.log("final pic is", pic)


			pic.save(function(err, response){
					if(err){console.log(error)}
					else{
						console.log("pic is", pic)
						// console.log(response);
						// res.redirect('/');
					}
				})




			Pic.findById(postData.parentId, function(err, doc){
				console.log('Doc is', doc)
				doc.children.push(pic._id)
				doc.save(function(err){
					if(err){
						console.log(err)
					}else{
						res.redirect('/');

					}
				})
			})




		})


		
		

    }
  });
})






router.get('/image.png', function (req, res) {
    res.sendfile(path.resolve('./uploads/image.png'));
});


router.get('/', function (req, res, next) {
//send sms to author
	// client.messages.create({
	//     body: "Someone is checking out Max's website",
	//     to: '+12068772788',  // Text this number
	//     from: '+12068008396' // From a valid Twilio number
	// })
	// .then((message) => console.log(message.sid));

	 res.render('index');

});





// router.post('/', function(req, res, next){
// 	var email = req.body.email;
// 	var user =  new User({
// 		firstName: 'Gaston',
// 		lastName: 'Kennedy',
// 		password: 'abcd',
// 		email: email
// 	})
// 	user.save();
// 	res.redirect('/')
// });




module.exports = router;








