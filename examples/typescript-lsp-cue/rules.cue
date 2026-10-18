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
	modules: [string]:   #Module
}

#Module: {
	imports: [...string]
}

// Turn the policy into closed, per-module constraints. This is what rejects a
// forbidden edge such as presentation -> data.
#ModulesFollowArchitecture: {
	for module, allowed in architecture.allowedImports {
		"\(module)": {
			imports: allowed
		}
	}
}

observation: #Observation

// Unification requires every intended function to be observed with its intended
// parameter and result types.
conforms: intent & observation & {
	modules: close(#ModulesFollowArchitecture)
}
