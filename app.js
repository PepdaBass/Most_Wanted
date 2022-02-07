'use strict';

//#region Menu functions

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
	app(people); // FIXME: sort out
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
			return mainMenu(person, people);
		case 'family':
			person = displayFamily(people, person);
      return mainMenu(person, people);
		case 'descendants':
			person = displayDescendants(people, person);
      return mainMenu(person, people);
		case 'restart':
			app(people); // restart
			break;
		case 'quit':
			return; // stop execution
		default:
			return mainMenu(person, people); // ask again
		// TODO: make me recursive when completing a case
		// TODO: display person's info in PromptFor
	}
}

//#endregion

//#region Filter functions.

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
			`Select an option, 'v' to view results, 'q' to quit.\n${optionsStrBuilder(traits)}`,
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
				let criterion = promptFor(`What is the person's ${selectedOption}?`, autoValid);

				let foundPeople = people.filter(function (person) {
					return person[convertToKey(selectedOption)].toLowerCase() == criterion;
				});

				return searchByTrait(foundPeople, cnt + 1);
		}
	} else {
		return selectPersonFromList(people);
	}
}

function displayDescendants(people, parent) {
	let descendants = people.filter(function (person) {
		return person.parents.includes(parent.id);
	});
	return selectPersonFromList(descendants);
}

//TODO: big ole refactor
function displayFamily(people, selectedPerson) {
  let relationships = []
	let familyMembers = people.filter(function (person) {
		if (person.id === selectedPerson.currentSpouse) {
			relationships.push("spouse");
      return true;
		} else if (person.parents.includes(selectedPerson.id)) {
      relationships.push("child");
			return true;
		} else if (isSiblings(selectedPerson, person)) {
      relationships.push("sibling");
			return true;
		} else if (selectedPerson.parents.includes(person.id)) {
      relationships.push("parent");
			return true;
		} else {
			return false;
		}
	});
	return selectPersonFromList(familyMembers, relationships);
}

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

//#region UI functions.

//** prompts user to select from a list of people by name */
function selectPersonFromList(people, relationships) {
	if (people.length === 0) {
		alert('Search results yielded no matches.');
		return app();
	}

	if (people.length === 1 && !relationships) {
		return people[0];
	}

	const names = namesList(people);

	let response = promptFor(
		`Choose a person to display their info\n${optionsStrBuilder(names, relationships)}`,
		response => optionsValidator(response, names),
	);

	const index = isNaN(response) ? names.indexOf(capitalize(response)) : response - 1;

	return people[index];
}

function namesList(people) {
	return people.map(person => `${person.firstName} ${person.lastName}`); // TODO: add custom list vars into line
}

function displayPerson(person) {
	let personInfo = `First Name: ${person.firstName}\n
Last Name: ${person.lastName}\n
Gender: ${person.gender}\n
DOB: ${person.dob}\n
Height: ${person.height}\n
Weight: ${person.weight}\n
Eye Color: ${person.eyeColor}\n
Occupation: ${person.occupation}`;

	alert(personInfo);
	return person;
}

//#endregion

//#region Validation functions

/**a function that takes in a question to prompt user, and a callback function to validate the user's input. */
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

// helper function to pass in as default promptFor validation. always true
function autoValid(input) {
	return true; // default validation only
}

/** validates an input against a list of options, returns appropriate bool */
function optionsValidator(userInput, options = [], customOptions = []) {
	userInput = userInput.toLowerCase();

	let combinedOptions = options.concat(customOptions).map(function (word) {
		return word.toLowerCase();
	});

	return combinedOptions.includes(userInput) || userInput <= options.length;
}

//#endregion;

//#region Helper functions.

function optionsStrBuilder(list, appendixList) {
	const numberedList = list.map(function (option, i) {
		return `${i + 1}) ${option}${appendixList ? ` (${appendixList[i]})` : ""}`;
	});
	return numberedList.join('\n');
}

function convertToKey(input) {
	input = input.split(' ').map(function (word, i) {
		if (i === 0) {
			return word.toLowerCase();
		} else {
			return capitalize(word);
		}
	});
	return input.join('');
}

function capitalize(string) {
	const words = string.split(' ');
	return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

//#endregion
