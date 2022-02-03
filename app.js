'use strict';

//Menu functions.
//Used for the overall flow of the application.
/////////////////////////////////////////////////////////////////
//#region

// app is the function called to start the entire application
function app(people) {
	let searchType = promptFor(
		"Do you know the name of the person you are looking for? Enter 'yes' or 'no'",
		autoValid,
	).toLowerCase();
	let searchResults;
	switch (searchType) {
		case 'yes':
		case 'y':
			searchResults = searchByName(people);
			break;
		case 'no':
		case 'n':
			searchResults = searchByTrait(people);
			if (!searchResults) {
				app(people);
			}
			break;

		case 'quit':
		case 'q':
			return;
		default:
			app(people); // restart app
			break;
	}

	// Call the mainMenu function ONLY after you find the SINGLE person you are looking for
	mainMenu(searchResults, people);
	app(people); // restart app
}

// Menu function to call once you find who you are looking for
function mainMenu(person, people) {
	/* Here we pass in the entire person object that we found in our search, as well as the entire original dataset of people. We need people in order to find descendants and other information that the user may want. */

	if (!person) {
		alert('Could not find that individual.');
		return app(people); // restart
	}

	let displayOption = promptFor(
		'Found ' +
			person.firstName +
			' ' +
			person.lastName +
			" . Do you want to know their 'info', 'family', or 'descendants'? Type the option you want or 'restart' or 'quit'",
		autoValid,
	);

	switch (displayOption) {
		case 'info':
			displayPerson(person);
			// TODO: get person's info
			break;
		case 'family':
			displayFamily(people, person);
			// TODO: get person's family
			break;
		case 'descendants':
			displayDescendants(people, person);
			// TODO: get person's descendants
			break;
		case 'restart':
			app(people); // restart
			break;
		case 'quit':
			return; // stop execution
		default:
			return mainMenu(person, people); // ask again
	}
}

function resultsMenu(results, people) {}

//#endregion

//Filter functions.
//Ideally you will have a function for each trait.
/////////////////////////////////////////////////////////////////
//#region

//nearly finished function used to search through an array of people to find matching first and last name and return a SINGLE person object.
function searchByName(people) {
	let firstName = promptFor("What is the person's first name?", autoValid);
	let lastName = promptFor("What is the person's last name?", autoValid);

	let foundPeople = people.filter(function (potentialMatch) {
		if (
			potentialMatch.firstName.toLowerCase() === firstName &&
			potentialMatch.lastName.toLowerCase() === lastName
		) {
			return true;
		} else {
			return false;
		}
	});
	// TODO: build additional functionality for duplicate names
	return foundPeople[0];
}

//unfinished function to search through an array of people to find matching eye colors. Use searchByName as reference.
function searchByTrait(people, cnt = 1) {
	const traits = [
		'First Name',
		'Last Name',
		'Gender',
		'DOB',
		'Height',
		'Weight',
		'Eye Color',
		'Occupation',
	];

	// 4 create validator(list, args*) for traits list and allow for custom validation options, add to promptFor
	// 5 implement flow to redirect based on count of 5 traits
	// BONUS: display input criteria alongside trait options
	//   a. allow user to change their search criteria for each trait
	//   b. store criteria in a variable and only search when prompted or cnt == 5

	let selectedTrait = promptFor(
		`Select an option, 'v' to view results, 'q' to quit.\n${optionsStrBuilder(
			traits,
		)}`,
		autoValid,
	);

	// if selectedOption == view results -> braek recursion, else if 'quit' -> return q??

	let criterion = promptFor(
		`What is the person's ${selectedTrait}?`,
		autoValid,
	);

	let foundPeople = people.filter(function (person) {
		return person[keyConverter(selectedTrait)] === criterion;
	});

	let moreCriteria = promptFor(
		'Would you like to choose another trait?',
		yesNo,
	);

	if ((cnt < 6 && moreCriteria === 'yes') || moreCriteria === 'y') {
		return searchByTrait(foundPeople, cnt + 1);
	} else {
		return displaySelectPerson(foundPeople);
	}
}

//#endregion

function displayDescendants(people, parent) {
	let descendants = people.filter(function (person) {
		return person.parents.includes(parent.id);
	});
	return displaySelectPerson(descendants);
}

function displayFamily(people, selectedPerson) {
	let familyMembers = people.filter(function (person) {
		if (person.currentSpouse === selectedPerson.id) {
			person.relationship = 'spouse';
			return true;
		} else if (person.parents.includes(selectedPerson.id)) {
			person.relationship = 'child';
			return true;
		} else if (isSiblings(selectedPerson, person)) {
			person.relationship = 'sibling';
			return true;
		} else if (selectedPerson.parents.includes(person.id)) {
			person.relationship = 'parent';
			return true;
		} else {
			return false;
		}
	});
	return displaySelectPerson(familyMembers);
}

//TODO: add other trait filter functions here.

function isSiblings(selectedPerson, person) {
	let sharedParents = [];
	if (selectedPerson !== person) {
		sharedParents = person.parents.filter(function (parentID) {
			return selectedPerson.parents.includes(parentID);
		});
	}
	return sharedParents.length !== 0;
}

//#endregion

//Display functions.
//Functions for user interface.
/////////////////////////////////////////////////////////////////
//#region

// alerts a list of people
function displaySelectPerson(people) {
	if (people.length === 0) {
		alert('Search results yielded no matches.');
		return app();
	}
	let index = promptFor(
		'Choose a person to display their info\n' +
			people
				.map(function (person, i) {
					const relationship = person.relationship
						? ` - relationship: ${person.relationship}`
						: '';
					return `${
						i + 1
					}) ${person.firstName} ${person.lastName}${relationship}`;
				})
				.join('\n'),
		autoValid,
	);
	return people[index - 1];
}

function displayPerson(person) {
	// print all of the information about a person:
	// height, weight, age, name, occupation, eye color.
	let personInfo = `First Name: ${person.firstName}\n
Last Name: ${person.lastName}\n
Gender: ${person.gender}\n
DOB: ${person.dob}\n
Height: ${person.height}\n
Weight: ${person.weight}\n
Eye Color: ${person.eyeColor}\n
Occupation: ${person.occupation}`;

	//TODO: replace concatenation with string-literal
	// TODO: finish getting the rest of the information to display.
	alert(personInfo);
}

//#endregion

//Validation functions.
//Functions to validate user input.
/////////////////////////////////////////////////////////////////
//#region

//a function that takes in a question to prompt, and a callback function to validate the user input.
//response: Will capture the user input.
//isValid: Will capture the return of the validation function callback. true(the user input is valid)/false(the user input was not valid).
//this function will continue to loop until the user enters something that is not an empty string("") or is considered valid based off the callback function(valid).
function promptFor(question, valid) {
	let isValid;
	do {
		var response = prompt(question).trim().toLowerCase();
		isValid = valid(response);
	} while (response === '' || isValid === false);
	return response;
}

// helper function/callback to pass into promptFor to validate yes/no answers.
function yesNo(input) {
	input = input.toLowerCase();
	return input == 'yes' || input == 'no' || input == 'n' || input == 'y';
}

// helper function to pass in as default promptFor validation.
//this will always return true for all inputs.
function autoValid(input) {
	return true; // default validation only
}

//Unfinished validation function you can use for any of your custom validation callbacks.
//can be used for things like eye color validation for example.
function customValidation(input) {}

// 4 create validator(list, args*) for traits list and allow for custom options, add to promptFor
// 5 implement flow to redirect based on count of 5 traits
// BONUS: display input criteria alongside trait options
//   a. allow user to change their search criteria for each trait
//   b. store criteria in a variable and only search when prompted or cnt == 5
// optionsValidator(userInput, traits, ['v', 'q'])

/** validates an input against a list of options, returns appropriate bool */
function optionsValidator(input, options = [], customOptions = []) {
	// compare input to both the options list & the customOptions (combine two arrays into one, before validating)
	input = input.toLowerCase();
	let combinedOptions = options.concat(customOptions).map(function (word) {
		return word.toLowerCase();
	});
	// must validate literal option (string)
	combinedOptions.includes(input);

	// combinedptions ['firstname', 'lastname', 'age', 'v', 'q' ]
	//                      1           2          3

	// combinedOptions.length is 5

	// must validate numeric option
	selectedNum = parseInt(input); // 6

	// must return a bool
}
//#endregion

//Helper functions.
//Functions to validate user input.
/////////////////////////////////////////////////////////////////
//#region

function optionsStrBuilder(list) {
	const numberedList = list.map(function (option, i) {
		return `${i + 1}) ${option}`;
	});
	return numberedList.join('\n');
}

function keyConverter(input) {
	input = input.split(' ').map(function (word, i) {
		if (i !== 0) {
			return word.charAt(0).toUpperCase() + word.slice(1);
		} else {
			return word;
		}
	});
	return input.join('');
}

//#endregion
