var controller = require('stackers'),
	_ = require('underscore'),
	config = require('../../conf');

_.str = require('underscore.string');

var Events = require('../collections/events'),
	Tickets = require('../collections/tickets'),
	Talks = require('../collections/talks');

var eventsController = controller({
	path : 'eventos'
});

eventsController.beforeEach(function(req, res, next){
	res.data.analytics = config.analytics || '';

	next();
});

eventsController.get('/:slug', function (req, res) {
	var events = new Events();

	events.fetchOne(function(item){
		return item.slug === req.params.slug;
	}).then(function(event){
		if(!event){ return res.send(404, 'Event not found');}

		var data = {
			event : event.toJSON(),
			user : req.session.passport.user
		};

		if(req.query['talk-send'] ){
			data.talkSend = true;
		}
		//TODO guardar en el usuario o buscar si tiene tickets
		if(req.query.ticket ){
			data.hasTicket = true;
		}

		res.render('events/call-for-proposals',data);
	});
});

eventsController.post('/:slug/call-for-proposals', function (req, res) {
	var events = new Events();
	var talks  = new Talks();
	var event;

	events.fetchOne(function(item){
		return item.slug === req.params.slug;
	}).then(function(_event){
		if(!_event){ return res.send(404);}
		event = _event;

		var talkData = {
			event : event.get('slug'),
			user : req.session.passport.user.username,
			framework : req.body.framework,
			sites : req.body.sites,
			experience : req.body.experience,
			approved : false
		};

		var talk = talks.add(talkData);

		return talk.save();
	}).then(function(){
		res.redirect('/eventos/'+ event.get('slug') + '?talk-send=success');
	}).catch(function(err){
		res.send(500, err);
	});
});

eventsController.post('/:slug/ticket', function (req, res) {
	var events = new Events(),
		tickets = new Tickets(),
		event;

	events.fetchOne(function(item) {
		return item.slug === req.params.slug;
	}).then(function(_event) {
		if (!_event) return res.send(404);
		event = _event;

		var newTicket = {
			event: event.get('slug'),
			user: req.session.passport.user.username,
		};
		var ticket = tickets.add(newTicket);
		return ticket.save();
	}).then(function() {
		res.redirect('/eventos/'+event.get('slug')+'?ticket=success');
	});

});

module.exports = eventsController;
