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
			if(this.options.showCompletion) this.setComponentsStatusByCompletion();
			this.render();
		},

		events: {
			'click .assessment-page-level-progress-item a': 'scrollToPageElement'
		},

		setComponentsStatusByCompletion: function() {
			_.each(this.collection.models, function(component){
				if(component.get('_isComplete') !== component.get('_isInteractionsComplete')) 
					component.set('_isInteractionsComplete', component.get('_isComplete'));
			})
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
	        this.$el.html(template({components:data, showCompletion:this.options.showCompletion}));
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
			var componentCompletionRatio = (this.options.showCompletion) 
				? this.collection.where({_isComplete:true}).length / this.collection.length
				: this.collection.where({_isInteractionsComplete:true}).length / this.collection.length;
			var percentageOfCompleteComponents = componentCompletionRatio*100;

			this.$('.assessment-page-level-progress-navigation-bar').css('width', percentageOfCompleteComponents+'%');

		},

		onProgressClicked: function(event) {
			event.preventDefault();
			Adapt.drawer.triggerCustomView(new AssessmentPageLevelProgressView({collection:this.collection, showCompletion:this.options.showCompletion}).$el, false);
		}

	});

	Handlebars.registerHelper('assessmentPageLevelProgressShowMarking', function() {
		var questions = _.filter(this.components, function(item) { return item._questionWeight != undefined; });
		return _.where(questions, {_isInteractionsComplete:true}).length / questions.length == 1 ? 'show-marking' : 'hide-marking';
	});

	Handlebars.registerHelper('assessmentPageLevelProgressMark', function() {
		if (this._questionWeight != undefined) return !!Math.floor(this._numberOfCorrectAnswers / this._items.length) ? 'correct' : 'incorrect';
		return '';
	});

	Adapt.on('articleView:postRender', function(view) {
        if (view.model.get('assessmentModel') && view.model.get('assessmentModel').get('_isEnabled')) {
        	//console.log("assessment page level progress: " + view.model.get('assessmentModel').get('_isResetOnRevisit') + " - " +  view.model.get('assessmentModel').get('_quizCompleteInSession'));
        	var showCompletion = !view.model.get('assessmentModel').get('_isResetOnRevisit') && view.model.get('assessmentModel').get('_quizCompleteInSession');
        	var c = new Backbone.Collection(view.model.findDescendants('components').where({'_isAvailable': true}));
            new AssessmentPageLevelProgressNavigationView({collection:c, showCompletion:showCompletion});
        }
    });
})
