package envelope

// intent is the deliberately small, human-owned contract. Function bodies are
// outside this adapter's observation.
intent: {
	functions: {
		displayName: {
			parameters: close({user: "User"})
			return: "string"
			async:  false
		}
		findUser: {
			parameters: close({id: "string"})
			return: "Promise": "User"
			async: true
		}
		greetingForUser: {
			parameters: close({id: "string"})
			return: "Promise": "string"
			async: true
		}
		handleGreetingRequest: {
			parameters: close({id: "string"})
			return: "Promise": "string"
			async: true
		}
	}
}
