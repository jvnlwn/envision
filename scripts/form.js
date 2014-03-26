;$(document).ready(function() {
	display(envision.questions)
})

// combined functions for displaying questions
function display(questions) {
	// throw the questions into the DOM
	displayQuestions(questions);
	// display explanation text
	retrieveExplanations();
	// change selected and corresponding scores based on current session for value added
	updateSelect('va', 'valueAdded');
	// change selected based on current session for applicability
	updateSelect('ap', 'applicable');
	// need to re-update data ater updateSelect functions run
	console.log(questions)
	setSession();
}

// appends each question to the tbody tag
function displayQuestions(questions) {
	var template = _.template($('#question').text())

	_.each(questions, function(question, index) {
		// append question
		$('tbody').append(template({question: question}))

		// set DOM values for question to be reference in change callbacks
		var DOM = {
			textArea:   $('.text-area').last().children('.bottom-section').children('textarea'),
			wordCount:  $('.text-area').last().children('.bottom-section').children('.word-number'),
			wordMet:    $('.text-area').last().children('.bottom-section').children('.word-minimum'),
			currentWord:$('.text-area').last().children('.bottom-section').children('.current-word-count'),
			score:      $('.category').last().children('.category-score'),
			maxPoints:  $('.category').last().children('.possible-points'),
			valueAdded: $('.category').last().children('.value-added').children('select'),
			applicable: $('.category').last().children('.applicability').children('select'),
			indexVal:   index
		}

		// set change callbacks
		DOM.applicable.change(applicable(question, DOM));
		DOM.valueAdded.change(updateValues(question, DOM));
		DOM.textArea.change(setSession);
		DOM.textArea.keyup(updateExplanation(question, DOM));
	})

	$('.question-separator').last().remove()
}

// change function for applicability select
function applicable(question, DOM) {

	return function() {
		// this is the select who's change callback was triggered
		var val = $(this).val();
		var maxScore = $('#max-score')

		envision.DOM.applicable[DOM.indexVal] = $(this).prop('selectedIndex')
		envision.scores[DOM.indexVal] = 0;

		// if select has been changed to not applicable . .
		if (val === 'not applicable') {
			DOM.valueAdded.children('.no-value').attr('selected', true)
			DOM.valueAdded.change();
			DOM.valueAdded.attr('disabled', 'disabled');
			
			maxScore.text(envision.maxScore -= question.maxPoints)
			DOM.score.text('- -')
			DOM.maxPoints.text('- -')

		} else {
			DOM.valueAdded.attr('disabled', false);
			maxScore.text(envision.maxScore += question.maxPoints)
			DOM.score.text(0)
			DOM.maxPoints.text(question.maxPoints)
		}

		// plans changed. Needed 20 word limit for if user chose not applicable.
		updateWordCount(question, DOM, val)
		// // set session
		setSession()
	}
}

// change function for value added select
function updateValues(question, DOM) {

	return function() {
		// this is the select who's change callback was triggered
		// val is current value of this select
		var val = $(this).val();
		// get selected index
		var selectedIndex = $(this).prop('selectedIndex');
		// get text
		var text = $($(this).children()[selectedIndex]).text()

		// update word count
		updateWordCount(question, DOM, text)
		// takes totalScore and subtracts the previous value and adds the new value resulting in the correct change in score
		envision.totalScore += parseInt(val) - parseInt(DOM.score.text());
		// setting score based on order of question
		envision.scores[DOM.indexVal] = parseInt(val);

		// set new score in DOM
		$('#actual-score').text(envision.totalScore);
		// set question's score to the value of the selected option
		DOM.score.text(val);

		// store the index of the selected option for recall purposes
		envision.DOM.valueAdded[DOM.indexVal] = selectedIndex;
		// save changes in envision to the session
		setSession();
	}
}

// update word count
function updateWordCount(question, DOM, text) {
	// get the word count
	question.wordCount = determineWordCount(getText(text));
	// update DOM
	DOM.wordCount.text(question.wordCount);
	// call keyup in textarea
	DOM.textArea.keyup();
}

// keyup function for textarea
function updateExplanation(question, DOM) {
	
	return function() {

        // words stands for characters now. Checking for charactar count
		var words = _.without($(this).val().split(''), ' ').length;
		// recording the explanation
		envision.explanations[DOM.indexVal] = $(this).val();

		// if word minimum requirement not met
		if (words < question.wordCount) {
			DOM.wordCount.css('color', 'rgb(255, 0, 0)');
			DOM.wordMet.text(' character minimum required for this level.');
			DOM.currentWord.text(words + '/' + question.wordCount + '.');
			question.enoughWords = false;
		} else {
			DOM.wordCount.css('color', 'rgb(0, 187, 0)');
			DOM.wordMet.text(' character minimum requirement met.');
			DOM.currentWord.text('');
			question.enoughWords = true;
		}
	}
}

// retrieve explanations
function retrieveExplanations() {
	$('textarea').each(function(index) {
		$(this).val(envision.explanations[index]);
		$(this).keyup();
	})
}

// update selects with selected option selected
function updateSelect(klass, propName) {
	// must catch the values here because activating each selects change method will alter the varacity of these values
	var totalScore = envision.totalScore;
	var maxScore = envision.maxScore;
	var textareas = $('textarea');

	$('.' + klass).each(function(index) {
		var selectedIndex = envision.DOM[propName][index]
		// check for 0 to avoid unecessary processing
		if (selectedIndex) {
			$(this).prop('selectedIndex', selectedIndex).change()
		} 
	})

	// reset values to what they should be here
	envision.totalScore = totalScore;
	envision.maxScore = maxScore;
	$('#actual-score').text(envision.totalScore)
	$('#max-score').text(envision.maxScore)
}

// update textareas
function updateTextarea() {
	$('textarea').keyup();
}

// character count
function determineWordCount(level) {
	console.log('hey switch case: ', level)
	switch (level) {
		case 'not'        : return  70;
		case 'Improved'   : return 140;
		case 'Enhanced'   : return 210;
		case 'Superior'   : return 280;
		case 'Conserving' : return 350;
		case 'Restorative': return 420;
		default           : return   0;
	}
}

// returns first word in string
function getText(text) {
	return text.slice(0, text.indexOf(' '))
}

// syncing envision
function syncEnvision(category) {
	envision.questions = envision[category].questions;
	envision.DOM = envision[category].DOM;
	envision.explanations = envision[category].explanations;
	envision.scores = envision[category].scores;
}

