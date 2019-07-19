const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

let UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		minlenght: 2,
		trim: true
	},
	password: {
		type: String,
		required: true,
		minlength: 6,
		trim: true
	},
	email: {
		type: String,
		required: true,
		trim: true,
		minlenght: 1,
		unique: true,
		validate: {
          validator: (value) => {
            return validator.isEmail(value);
          },
          message: '{VALUE} is not a valid email!'
        }
	},
	imageUrl: {
		required: true,
		type: String,
		trim: true
	}
});

UserSchema.methods.toJSON = function(){
	let User = this;
	let UserObject = User.toObject();
	return _.pick(UserObject, ['_id','name','email','imageUrl']);
}

UserSchema.methods.generateAuthToken = function(){
	let user = this;
	let access = 'userToken';
	let token = jwt.sign({_id: (user._id), access}, process.env.JWT_SECRET).toString();
	return token
}
UserSchema.statics.findByToken = function(token){
	let User = this;
	let decoded;
	try {
	  decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch(err) {
		return Promise.reject();
	}
	if(decoded.access === 'userToken'){
		return User.findOne({
			'_id': decoded._id
		});
	}else{
		return Promise.reject();
	}
}
UserSchema.statics.findByCredentials = function(phoneNumber, password){
	User = this;
	return User.findOne({phoneNumber}).then((user) => {
		if(!user){
			return Promise.reject();
		}
		return new Promise((resolve, reject) => {
			bcrypt.compare(password, user.password, (err, res) => {
				if(res){
					resolve(user);
				}else{
					reject();
				}
			});
		});
	});
}
UserSchema.pre('save', function(next){
	let user = this;
	if(user.isModified('password')){
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				user.password = hash;
				next();
			});
		});
	}else{
		next();
	}
});
UserSchema.pre('findOneAndUpdate', function(next){
	let user = this;
	if(user._update['password']){
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user._update['password'], salt, (err, hash) => {
				user._update['password'] = hash;
				next();
			});
		});
	}else{
		next();
	}
});

let User = mongoose.model('User', UserSchema);

module.exports = {User}