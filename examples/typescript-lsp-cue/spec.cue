package envelope

// intent is the deliberately small, human-owned contract. Function bodies are
// outside this adapter's observation.
intent: {
	functions: {
		greet: {
			parameters: close({name: "string"})
			return: "string"
			async:  false
		}
		findUser: {
			parameters: close({id: "string"})
			return: "Promise": "User"
			async: true
		}
	}
}
