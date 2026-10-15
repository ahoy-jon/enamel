package envelope

// This is the human-owned architectural policy. The keys are the observable
// modules and each list is the complete set of permitted local dependencies.
// A presentation handler importing the repository or database directly causes
// a CUE conflict.
architecture: {
	allowedImports: {
		"src/domain/user.ts": []
		"src/infrastructure/database.ts": ["src/domain/user.ts"]
		"src/data/userRepository.ts": [
			"src/domain/user.ts",
			"src/infrastructure/database.ts",
		]
		"src/application/greetingService.ts": [
			"src/data/userRepository.ts",
			"src/domain/user.ts",
		]
		"src/presentation/greetingHandler.ts": ["src/application/greetingService.ts"]
	}
}
