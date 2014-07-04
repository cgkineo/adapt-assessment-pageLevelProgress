/*
* Assessment Page Level Progress
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Chris Steele <chris.steele@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var AssessmentPageLevelProgressView = Backbone.View.extend({

		className: "assessment-page-level-progress",

		initialize: function() {
			this.listenTo(Adapt, 'remove', this.remove);
			this.render();
		},

		events: {
			'click .assessment-page-level-progress-item a': 'scrollToPageElement'
		},

		scrollToPageElement: function(event) {
			event.preventDefault();
			var currentComponentSelector = '.' + $(event.currentTarget).attr('data-assessment-page-level-progress-id');
			var $currentComponent = $(currentComponentSelector);
			$(window).scrollTo($currentComponent, {offset:{top:-$('.navigation').height()}});
			Adapt.trigger('page:scrollTo', currentComponentSelector);
			Adapt.trigger('drawer:closeDrawer');
		},

		render: function() {
			var data = this.collection.toJSON();
	        var template = Handlebars.templates["assessmentPageLevelProgress"];
	        this.$el.html(template({components:data}));
	        return this;
		}

	});

	var AssessmentPageLevelProgressNavigationView = Backbone.View.extend({

		tagName: 'a',

		className: 'assessment-page-level-progress-navigation',

		initialize: function() {
			this.listenTo(Adapt, 'remove', this.remove);
			this.listenTo(this.collection, 'change:_isInteractionsComplete', this.updateProgressBar);
			this.$el.attr('href', '#');
			this.render();
			this.updateProgressBar();

			console.log("aplp assessment components: " + this.collection.length);
		},

		events: {
			'click': 'onProgressClicked'
		},

		render: function() {
			var data = this.collection.toJSON();
	        var template = Handlebars.templates["assessmentPageLevelProgressNavigation"];
	        $('.navigation-drawer-toggle-button').after(this.$el.html(template({components:data})));
	        return this;
		},

		updateProgressBar: function() {
			var componentCompletionRatio = this.collection.where({_isInteractionsComplete:true}).length / this.collection.length;
			var percentageOfCompleteComponents = componentCompletionRatio*100;

			this.$('.assessment-page-level-progress-navigation-bar').css('width', percentageOfCompleteComponents+'%');

		},

		onProgressClicked: function(event) {
			event.preventDefault();
			Adapt.drawer.triggerCustomView(new AssessmentPageLevelProgressView({collection:this.collection}).$el, false);
		}

	});

	Handlebars.registerHelper('assessmentPageLevelProgressShowMarking', function() {
		console.log(this.components.length);
		return _.where(this.components, {_isInteractionsComplete:true}).length / this.components.length == 1 ? 'show-marking' : 'hide-marking';
	});

	/*Handlebars.registerHelper('assessmentPageLevelProgressMark', function() {
		return !!Math.floor(this._numberOfCorrectAnswers / this._items.length) ? 'correct' : 'incorrect';
	});*/

	Adapt.on('articleView:postRender', function(view) {
        if (view.model.get('_assessment') && view.model.get('_assessment')._isEnabled) {
        	var c = new Backbone.Collection(view.model.findDescendants('components').where({'_isAvailable': true}));
            new AssessmentPageLevelProgressNavigationView({collection:c});
        }
    });
})