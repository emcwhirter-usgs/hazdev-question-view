'use strict';

var Util = require('util/Util'),
    View = require('mvc/View');


// Default values used by constructor.
var _DEFAULTS = {
  // label - The question being asked
  label: null,
  // multiSelect - false = radio buttons, true = or checkboxes, radio is default
  multiSelect: false,
  // selectedAnswer - Any answers that should be selected by default
  selectedAnswer: null,
  // answers - Array of answers, each with attributes:
  //      value - The "value" for the input
  //      label - The answer to show the user
  //      otherValue - Optional extra value for more info
  //      otherLabel - Question to ask associate with otherValue
  answers: null
};

var _ID_SEQUENCE = 0;


// ----------------------------------------------------------------------
// Initialization Methods
// ----------------------------------------------------------------------

/**
 * Class: QuestionView
 * Creates a new QuestionView.
 *
 * @param options {Object}
 *        An object containing configuration options. See _DEFAULTS above for
 *        detailed documentation on what can be specified.
 */
var QuestionView = function (options) {
  var _this,
      _initialize,

      _answerIndex,
      _answerList,
      _options,

      _addAnswer,
      _addAnswers,
      _onBlur,
      _onChange;


  _this = View(options);
  /**
   * @constructor
   *
   */
  _initialize = function (options) {
    var section = document.createElement('section');

    _options = Util.extend({}, _DEFAULTS, options);
    _answerIndex = [];

    section.classList.add('question');

    section.appendChild(_addAnswers());

    _this.setAnswers(_options.selectedAnswer);

    _this.el.innerHTML = '';
    _this.el.appendChild(section);
  };


  /**
   * Wrap a single answer in appropriate html.
   *
   * @param answer {Object}
   *        qId {Integer} Unique identifier for the question
   *        ul {Document.Element} Container element for the answers
   *
   * @return String
   *         Contains an answer wrapped in appropriate HTML.
   *
   */
  _addAnswer = function (answer, qId, ul) {
    var _label = answer.label,
        _otherLabel = answer.otherLabel,
        _otherValue = answer.otherValue,
        _value = answer.value,
        answerId = 'answer-' + (++_ID_SEQUENCE),
        inputType = (_options.multiSelect ? 'checkbox' : 'radio'),
        li = document.createElement('li'),
        label = document.createElement('label'),
        input = document.createElement('input'),
        answerText = document.createTextNode(_label);

    input.type = inputType;
    input.name = qId;
    input.id = answerId;
    input.value = _value;

    label.setAttribute('for', answerId);
    label.classList.add('answer');
    label.appendChild(answerText);

    li.appendChild(input);
    li.appendChild(label);

    if (typeof _otherLabel === 'string') {
      var textbox = document.createElement('input');
      textbox.type = 'text';
      textbox.name = qId + '-other';
      textbox.id = answerId + '-other';
      textbox.value = _otherValue;
      textbox.classList.add('question-other');
      textbox.placeholder = _otherLabel;
      li.appendChild(textbox);
    }
    ul.appendChild(li);
  };

  /**
   * Add all answers to the list of answers.
   *
   * @return String
   *         Contains a list of answer options wrapped in appropriate HTML.
   *
   */
  _addAnswers = function () {
    var answers = _options.answers,
        answerElement,
        questionId = 'question-' + (++_ID_SEQUENCE),
        legend = document.createElement('legend'),
        ul = document.createElement('ul'),
        answerIndex = _answerIndex,
        answer,
        i,
        len;

    ul.classList.add('question-answers');
    _answerList = document.createElement('fieldset');
    _answerList.name = questionId;
    legend.textContent = options.label;
    _answerList.appendChild(legend);

    if (answers !== null) {
      for (i=0, len=answers.length; i<len; i++) {
        _addAnswer(answers[i], questionId, ul);
      }
      _answerList.appendChild(ul);

      // Keep track of answers with array of answer objects.
      for (i=0, len=answers.length; i<len; i++) {
        answer = answers[i];

        answerIndex[answer.value] = i;
      }

      answerElement = _answerList.getElementsByTagName('li');
      for (i=0, len=answerElement.length; i<len; i++) {
        var inputs = answerElement[i].getElementsByTagName('input');
        inputs[0].addEventListener('change', _onChange);
        if (inputs[1] !== undefined) {
          inputs[1].addEventListener('blur', _onBlur);
        }
      }
    }

    return _answerList;
  };

  /**
   * Event listener for "other" inputs.
   * Text boxes.
   *      If the value in the text box changes, save the change.
   *
   */
  _onBlur = function (ev) {
    var _target = ev.target,
        answers = _options.answers,
        answerElement = _answerList.getElementsByTagName('li'),
        i,
        len = answerElement.length;

    for (i=0; i<len; i++) {
      var inputs = answerElement[i].getElementsByTagName('input');
      if (inputs[1] === _target) {
        if (answers[i].otherValue !== _target.value) {
          answers[i].otherValue = _target.value;
          _this.trigger('change', _this);
        }
        break;
      }
    }
  };

  /**
   * Event listener for "other" inputs.
   * Radio buttons & check boxes.
   *       Enable or disable text boxes associated with "other".
   *       Put focus in text box when associated radio/checkbox is selected.
   *
   */
  _onChange = function (ev) {
    var _target = ev.target,
        answerElement = _answerList.getElementsByTagName('li'),
        i,
        len = answerElement.length,
        checked;

    for (i=0; i<len; i++) {
      var inputs = answerElement[i].getElementsByTagName('input');
      // If there is an "other" input textbox
      if (inputs[1] !== undefined) {
        checked = inputs[0].checked;
        inputs[1].disabled = !checked;
        // If the "other" input checkbox for this textbox is target
        if (inputs[0] === _target && checked) {
          inputs[1].focus();
          inputs[1].setSelectionRange(0, inputs[1].value.length);
        }
      }
    }
    _this.trigger('change', _this);
  };


// ----------------------------------------------------------------------
// Public Methods
// ----------------------------------------------------------------------


  /**
   * Clear all answers.
   *       Uncheck all check boxes and radio buttons.
   *       Disable all text boxes for "other" fields.
   */
  _this.clearAnswers = function () {
    var answerElement = _answerList.getElementsByTagName('li'),
        i,
        len = answerElement.length;

    for (i=0; i<len; i++) {
      var inputs = answerElement[i].getElementsByTagName('input');
      inputs[0].checked = false;
      // If there is an "other" input textbox
      if (inputs[1] !== undefined) {
        inputs[1].disabled = true;
      }
    }
  };

  /**
   * Clean up event listeners, remove list of answers
   *
   */
  _this.destroy = function () {
    var answerElement = _answerList.getElementsByTagName('li'),
        i,
        len = answerElement.length;

    _answerList = null;
    for (i=0; i<len; i++) {
      var inputs = answerElement[i].getElementsByTagName('input');
      inputs[0].removeEventListener('change', _onChange);
      if (inputs[1] !== undefined) {
        inputs[1].removeEventListener('blur', _onBlur);
      }
      inputs = null;
    }
    answerElement = null;
  };

  /**
   * Return list of answers.
   *
   * @return {Object|Array}
   *         Null if no answers are selected
   *         An object containing a single answer if only 1 is selected
   *         An array of answer objects if there is more than 1
   */
  _this.getAnswers = function () {
    var currentAnswer = [],
        answerElement = _answerList.getElementsByTagName('li'),
        checkedAnswer,
        i,
        len = answerElement.length;

    for (i=0; i<len; i++) {
      var inputs = answerElement[i].getElementsByTagName('input');
      if (inputs[0].checked) {
        if (inputs[1] !== undefined) {
          checkedAnswer = {
            value: inputs[0].value,
            label: answerElement[i].innerText,
            otherValue: inputs[1].value,
            otherLabel: inputs[1].placeholder
          };
        } else {
          checkedAnswer = {
            value: inputs[0].value,
            label: answerElement[i].innerText
          };
        }
        currentAnswer.push(
          checkedAnswer
        );
      }
    }

    if (currentAnswer.length === 0) {
      return null;
    } else if (_options.multiSelect) {
      return currentAnswer;
    } else {
      return currentAnswer[0];
    }
  };

  /**
   * Sets input.checked on input elements.
   * Assumes a string for the "value" of a single answer.
   *
   * @param {String}
   *        The "value" of the selected answer.
   */
  _this.selectAnswers = function (answer) {
    var inputs;

    if (typeof answer !== 'undefined') {
      inputs = answer.getElementsByTagName('input');
      if (inputs[0]) {
        inputs[0].checked = true;
        // If there is an "other" input textbox
        if (inputs[1] !== undefined) {
          inputs[1].disabled = false;
        }
      }
    }
  };

  /**
   * Finds all of the selected answers.
   * Calls selectAnswer with each of them.
   *
   * Assumes a string for the value of a single answer if multiSelect:false
   * Assumes an array of answer values if multiSelect:true
   *
   * @param {String|Array}
   *        A string containing the "value" of the selected answer.
   *        The list of currently selected answers as strings.
   */
  _this.setAnswers = function (selectedAnswer) {
    var answerElement,
        answer,
        i,
        len;

    if (_answerList !== null) {
      answerElement = _answerList.getElementsByTagName('li');

      // Make sure everything is unchecked first
      _this.clearAnswers();

      if (selectedAnswer === null) {
        return;
      }

      if (typeof selectedAnswer === 'string') {
        answer = answerElement[_answerIndex[selectedAnswer]];
        _this.selectAnswers(answer);
      } else {  // Array of strings
        for (i=0, len=selectedAnswer.length; i<len; i++) {
          answer = answerElement[_answerIndex[selectedAnswer[i]]];
          _this.selectAnswers(answer);
        }
      }
    }
  };

  _initialize(options);
  options = null;
  return _this;
};

module.exports = QuestionView;
