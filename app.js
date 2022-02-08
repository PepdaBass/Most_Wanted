'use strict';

//#region Menu functions

// app is the function called to start the entire application
function app(people) {
	//TODO: change from y/n to search by name / search by trait options, with q to quit
	let searchType = promptFor(
		"Do you know the name of the person you are looking for? Enter 'yes' or 'no'",
		yesNo,
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
				app(people); // restart
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
}

// Menu function to call once you find who you are looking for
function mainMenu(person, people) {
	/* Here we pass in the entire person object that we found in our search, as well as the entire original dataset of people. 
	We need people in order to find descendants and other information that the user may want. */

	if (!person) {
		alert('Could not find that individual.');
		return app(people); // restart
	}
	const options = ['Info', 'Family', 'Descendants', 'Restart', 'Quit'];

	let displayOption = promptFor(
		`Found ${person.firstName} ${person.lastName}.\n
Select an option:
${optionsStrBuilder(options)}`,
		function (response) {
			return optionsValidator(response, options, ['i', 'f', 'd', 'r', 'q']);
		},
	);

	displayOption = convertNumericSelection(displayOption, options);

	switch (displayOption) {
		case 'info':
		case 'i':
			person = displayPerson(person);
			return mainMenu(person, people);
		case 'family':
		case 'f':
			person = displayFamily(people, person);
			return mainMenu(person, people);
		case 'descendants':
		case 'd':
			person = displayDescendants(people, person);
			return mainMenu(person, people);
		case 'restart':
		case 'r':
			app(people); // restart
			break;
		case 'quit':
		case 'q':
			return; // stop execution
		default:
			return mainMenu(person, people); // ask again
	}
}

//#endregion

//#region Filter functions.

function searchByName(people) {
	let name = promptFor(
		'Please enter the first and last name of the person you are searching for:',
		userInput => validateName(userInput, people),
	);
	const foundPeople = filterByName(name, people);
	return selectPersonFromList(foundPeople);
}

function validateName(name, people) {
	if (name === '') return false;
	if (name.split(' ').length !== 2) {
		alert('Please enter only the FIRST and LAST name.');
		return false;
	}
	if (filterByName(name, people).length !== 1) {
		alert(`"${name}" is not in the database.`);
		return false;
	}
	return true;
}

function filterByName(name, people) {
	const [firstName, lastName] = name.split(' ');
	return people.filter(
		person =>
			person.firstName.toLowerCase() === firstName && person.lastName.toLowerCase() === lastName,
	);
}

function searchByTrait(people, cnt = 0, criteriaList = []) {
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

	criteriaList = criteriaList.length === 0 ? traits.map(() => '') : criteriaList;

	if (cnt < 5) {
		let selectedOption = promptFor(
			`Select an option, 'v' to view results, 'q' to quit.\n${optionsStrBuilder(
				traits,
				criteriaList,
			)}`,
			function (response) {
				return optionsValidator(response, traits, ['q', 'v']);
			},
		);

		selectedOption = convertNumericSelection(selectedOption, traits);

		switch (selectedOption) {
			case 'v':
				const filteredPeople = multCriteriaFilter(people, criteriaList, traits);
				return selectPersonFromList(filteredPeople);
			case 'q':
				return;
			default:
				let criterion = promptFor(`What is the person's ${selectedOption}?`, autoValid);
				criteriaList[traits.indexOf(capitalize(selectedOption))] = criterion;

				return searchByTrait(people, cnt + 1, criteriaList);
		}
	} else {
		const filteredPeople = multCriteriaFilter(people, criteriaList, traits);
		return selectPersonFromList(filteredPeople);
	}
}

function multCriteriaFilter(people, criteriaList, traits) {
	criteriaList.forEach((criterion, i) => {
		if (criterion) {
			people = people.filter(person => person[convertToKey(traits[i])].toLowerCase() == criterion);
		}
	});
	return people;
}

function displayDescendants(people, parent) {
	let descendants = people.filter(function (person) {
		return person.parents.includes(parent.id);
	});
	if (!descendants.length) {
		alert('No descendants found.');
		return parent;
	}
	return selectPersonFromList(descendants, undefined, parent);
}

function displayFamily(people, selectedPerson) {
	let relationships = [];
	let familyMembers = people.filter(function (person) {
		if (person.id === selectedPerson.currentSpouse) {
			relationships.push('spouse');
			return true;
		} else if (person.parents.includes(selectedPerson.id)) {
			relationships.push('child');
			return true;
		} else if (isSiblings(selectedPerson, person)) {
			relationships.push('sibling');
			return true;
		} else if (selectedPerson.parents.includes(person.id)) {
			relationships.push('parent');
			return true;
		} else {
			return false;
		}
	});
	return selectPersonFromList(familyMembers, relationships, selectedPerson);
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
function selectPersonFromList(people, appendixList, prevPerson) {
	if (people.length === 0) {
		alert('Search results yielded no matches.');
		return;
	}

	if (people.length === 1 && !appendixList) {
		return people[0];
	}

	const names = namesList(people);

	let response = promptFor(
		`Choose a person to display their info${
			prevPerson ? ` or 'b' to go back to ${prevPerson.firstName} ${prevPerson.lastName},` : ''
		}.\n${optionsStrBuilder(names, appendixList)}`,
		response => optionsValidator(response, names, ['b']),
	);

	switch (response) {
		case 'b':
			return prevPerson;
		default:
			const index = isNaN(response) ? names.indexOf(capitalize(response)) : response - 1;
			return people[index];
	}
}

function namesList(people) {
	return people.map(person => `${person.firstName} ${person.lastName}`);
}

function displayPerson(person) {
	let personInfo = `First Name: ${person.firstName}
Last Name: ${person.lastName}
Gender: ${person.gender}
DOB: ${person.dob}
Height: ${person.height}
Weight: ${person.weight}
Eye Color: ${person.eyeColor}
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
		return `${i + 1}) ${option}${appendixList && appendixList[i] ? ` (${appendixList[i]})` : ''}`;
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

function convertNumericSelection(input, choices) {
	if (!isNaN(input)) {
		let index = parseInt(input) - 1;
		input = choices[index].toLowerCase();
	}
	return input;
}

//#endregion
