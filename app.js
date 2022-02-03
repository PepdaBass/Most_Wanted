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
	let searchResult;
	switch (searchType) {
		case 'yes':
		case 'y':
			searchResult = searchByName(people);
			break;
		case 'no':
		case 'n':
			searchResult = searchByTrait(people);
			if (!searchResult) {
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
	mainMenu(searchResult, people);
	app(people); // restart app
}

// Menu function to call once you find who you are looking for
function mainMenu(person, people) {
	/* Here we pass in the entire person object that we found in our search, as well as the entire original dataset of people. 
	We need people in order to find descendants and other information that the user may want. */

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
			person = displayPerson(person);
			// mainMenu(person);
			break;
		case 'family':
			displayFamily(people, person);
			break;
		case 'descendants':
			displayDescendants(people, person);
			break;
		case 'restart':
			app(people); // restart
			break;
		case 'quit':
			return; // stop execution
		default:
			return mainMenu(person, people); // ask again

		// TODO: make me recursive when completing a case
	}
}

//#endregion

//Filter functions.
//Ideally you will have a function for each trait.
/////////////////////////////////////////////////////////////////
//#region

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
	return selectPersonFromList(foundPeople);
}

function searchByTrait(people, cnt = 0) {
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

	// BONUS: display input criteria alongside trait options
	//   a. allow user to change their search criteria for each trait
	//   b. store criteria in an array and only search when prompted or cnt == 5

	if (cnt < 5) {
		let selectedOption = promptFor(
			`Select an option, 'v' to view results, 'q' to quit.\n${optionsStrBuilder(
				traits,
			)}`,
			function (response) {
				return optionsValidator(response, traits, ['q', 'v']);
			},
		);

		if (!isNaN(selectedOption)) {
			const index = parseInt(selectedOption) - 1;
			selectedOption = traits[index].toLowerCase();
		}

		switch (selectedOption) {
			case 'v':
				return selectPersonFromList(people);
			case 'q':
				return;
			default:
				let criterion = promptFor(
					`What is the person's ${selectedOption}?`,
					autoValid,
				);

				let foundPeople = people.filter(function (person) {
					return (
						person[convertToKey(selectedOption)].toLowerCase() == criterion
					);
				});

				return searchByTrait(foundPeople, cnt + 1);
		}
	} else {
		return selectPersonFromList(people);
	}
}

//#endregion

function displayDescendants(people, parent) {
	let descendants = people.filter(function (person) {
		return person.parents.includes(parent.id);
	});
	return selectPersonFromList(descendants);
}

function displayFamily(people, selectedPerson) {
	let familyMembers = people.filter(function (person) {
		if (person.currentSpouse === selectedPerson.id) {
			person.relationship = 'spouse'; // FIXME: mutating the entries in the database instead of just displaying relevant info
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
	return selectPersonFromList(familyMembers);
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
function selectPersonFromList(people) {
	if (people.length === 0) {
		alert('Search results yielded no matches.');
		return app();
	}

	if (people.length === 1) {
		return people[0];
	}

	let index =
		promptFor(
			`Choose a person to display their info\n${peopleListStrBldr(people)}`,
			autoValid,
		) - 1; // TODO: validate user options (optionsValidator)

	// TODO: convert index into person's name if string
	return people[index];
}

function peopleListStrBldr(people, customList = []) {
	const str = people
		.map(function (person, i) {
			return `${i + 1}) ${person.firstName} ${person.lastName}`; // TODO: add custom list vars into line
		})
		.join('\n');
	return str;
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
	return person;
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
	input = input.toLowerCase();
	let combinedOptions = options.concat(customOptions).map(function (word) {
		return word.toLowerCase();
	});

	const selectedNum = parseInt(input);
	if (combinedOptions.includes(input)) {
		return true;
	} else if (selectedNum <= options.length) {
		return true;
	} else return false;
}
//#endregion;

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

function convertToKey(input) {
	input = input.split(' ').map(function (word, i) {
		if (i === 0) {
			return word.toLowerCase();
		} else {
			return word.charAt(0).toUpperCase() + word.slice(1);
		}
	});
	return input.join('');
}

//#endregion
