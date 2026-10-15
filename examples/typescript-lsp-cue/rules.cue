package envelope

// #Function is the stable shape promised by the extractor. Its closed
// definition rejects malformed generated observations as well as disagreements.
#Parameter: {
	[string]: string
}

#Function: {
	parameters: #Parameter
	return:     _
	async:      bool
}

#Observation: {
	functions: [string]: #Function
}

observation: #Observation

// Unification requires every intended function to be observed with its intended
// parameter and result types.
conforms: intent & observation
