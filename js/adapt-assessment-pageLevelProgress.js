/*
* Assessment Page Level Progress
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Chris Steele <chris.steele@kineo.com>, Gavin McMaster <gavin.mcmaster@kineo.com>
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
	        var opts = {
	        	components:data,
	        	showCompletion:this.options.showCompletion,
	        	incrementalMarking:this.options.incrementalMarking,
	        	showMarking:this.options.showMarking,
	        	showProgress:this.options.showProgress
	        }

	        this.$el.html(template(opts));
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

			var opts = {
				collection:this.collection,
				showCompletion:this.options.showCompletion,
				incrementalMarking:this.options.incrementalMarking,
				showMarking:this.options.showMarking,
				showProgress:this.options.showProgress
			};

			Adapt.drawer.triggerCustomView(new AssessmentPageLevelProgressView(opts).$el, false);
		}

	});

	Handlebars.registerHelper('assessmentPageLevelProgressShowMarking', function() {
		if (!this.showMarking) return 'hide-marking';

		var questions = _.filter(this.components, function(item) { return item._questionWeight != undefined; });
		
		return this.incrementalMarking || _.where(questions, {_isInteractionsComplete:true}).length / questions.length == 1 ? 'show-marking' : 'hide-marking';
	});

	Handlebars.registerHelper('assessmentPageLevelProgressMark', function() {
		if (this._questionWeight != undefined && this._isInteractionsComplete) return !!Math.floor(this._numberOfCorrectAnswers / this._items.length) ? 'correct' : 'incorrect';
		return '';
	});

	Adapt.on('articleView:postRender', function(view) {
        if (view.model.get('assessmentModel') && view.model.get('assessmentModel').get('_isEnabled')) {
        	//console.log("assessment page level progress: " + view.model.get('assessmentModel').get('_isResetOnRevisit') + " - " +  view.model.get('assessmentModel').get('_quizCompleteInSession'));
        	var c = new Backbone.Collection(view.model.findDescendants('components').filter(function(item) {
        		return item.get('_isAvailable') && item.get('_pageLevelProgress') && item.get('_pageLevelProgress')._useAssessment;
        	}));

        	if (c.length === 0) return;
        	
        	var showCompletion = !view.model.get('assessmentModel').get('_isResetOnRevisit') && view.model.get('assessmentModel').get('_quizCompleteInSession');
        	var assessmentPageLevelProgress = view.model.get('assessmentModel').get('_assessmentPageLevelProgress');
        	var incrementalMarking = assessmentPageLevelProgress && assessmentPageLevelProgress._incrementalMarking;
        	var showMarking = assessmentPageLevelProgress && assessmentPageLevelProgress._showMarking;
        	var showProgress = assessmentPageLevelProgress && assessmentPageLevelProgress._showProgress;
        	
        	var opts = {
        		collection:c,
        		showCompletion:showCompletion,
        		incrementalMarking:incrementalMarking,
        		showMarking:showMarking,
        		showProgress:showProgress
        	};

            new AssessmentPageLevelProgressNavigationView(opts);
        }
    });
})
